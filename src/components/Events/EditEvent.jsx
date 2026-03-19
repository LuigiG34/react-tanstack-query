import {Link, useNavigate, useParams} from 'react-router-dom';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import {useMutation, useQuery} from "@tanstack/react-query";
import {fetchEvent, queryClient, updateEvent} from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();

  const {data, isPending,isError, error} = useQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({signal, id: params.id})
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;

      await queryClient.cancelQueries({queryKey: ['events', params.id]}); // Cancel other queries to avoid clashing actions
      const previousEvent = queryClient.getQueryData(['events', params.id]);

      queryClient.setQueryData(['events', params.id], newEvent); // Optimistically update

      return { previousEvent }; // This is our context in onError
    },
    onError: (error, data, context) => {
      // Rollback our optimistic update if failure
      queryClient.setQueryData(['events', params.id], context.previousEvent);
    },
    // If mutation finished we fetch the latest data in our backend to not be out of sync
    onSettled: () => {
      queryClient.invalidateQueries(['events', params.id]);
    }
  })

  function handleSubmit(formData) {
    mutate({ id: params.id, event: formData });
    navigate('../');
  }

  function handleClose() {
    navigate('../');
  }

  let content;
  if(isPending){
    content = <div className='center'>
      <LoadingIndicator/>
    </div>
  }
  if(isError) {
    content = <>
      <ErrorBlock title='An error occured' message={error.info?.message || 'Fallback error message...'} />
      <div className='form-actions'>
        <Link to="../" className='button'>
          Okey
        </Link>
      </div>
    </>
  }
  if(data){
    content = <EventForm inputData={data} onSubmit={handleSubmit}>
      <Link to="../" className="button-text">
        Cancel
      </Link>
      <button type="submit" className="button">
        Update
      </button>
    </EventForm>
  }

  return (
    <Modal onClose={handleClose}>{content}</Modal>
  );
}
