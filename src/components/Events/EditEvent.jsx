import {Link, redirect, useNavigate, useNavigation, useParams, useSubmit} from 'react-router-dom';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import {useQuery} from "@tanstack/react-query";
import {fetchEvent, queryClient, updateEvent} from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const params = useParams();
  const submit = useSubmit();

  const {data,isError, error} = useQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({signal, id: params.id}),
    staleTime: 10000,
  });

  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   onMutate: async (data) => {
  //     const newEvent = data.event;
  //
  //     await queryClient.cancelQueries({queryKey: ['events', params.id]}); // Cancel other queries to avoid clashing actions
  //     const previousEvent = queryClient.getQueryData(['events', params.id]);
  //
  //     queryClient.setQueryData(['events', params.id], newEvent); // Optimistically update
  //
  //     return { previousEvent }; // This is our context in onError
  //   },
  //   onError: (error, data, context) => {
  //     // Rollback our optimistic update if failure
  //     queryClient.setQueryData(['events', params.id], context.previousEvent);
  //   },
  //   // If mutation finished we fetch the latest data in our backend to not be out of sync
  //   onSettled: () => {
  //     queryClient.invalidateQueries(['events', params.id]);
  //   }
  // })

  function handleSubmit(formData) {
    submit(formData, {method: 'PUT'});
  }

  function handleClose() {
    navigate('../');
  }

  let content;
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
      {state === 'submitting' ? <p>Sending data...</p> :
          (
              <>
                <Link to="../" className="button-text">
                  Cancel
                </Link>
                <button type="submit" className="button">
                  Update
                </button>
              </>
          )
      }

    </EventForm>
  }

  return (
      <Modal onClose={handleClose}>{content}</Modal>
  );
}

export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({signal, id: params.id})
  });
}

export async function action({ request, params }) {
  const formDate = await request.formData();
  const updatedEventData = Object.fromEntries(formDate);
  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(['events']);

  return redirect('../');
}