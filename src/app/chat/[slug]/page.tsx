"use client"
import {PaperAirplaneIcon, XCircleIcon} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

import { useEffect, useState } from "react"

type ErrorNotificationProps = {
  errorMessage: string;
};


function PageNotFound() {
  return (<div className="w-full h-screen text-white flex justify-center items-center">
    <div className="mx-auto ">
      404 Page not found
    </div>
  </div>)
}

function ErrorNotification({ errorMessage }: ErrorNotificationProps) {
  return (
    <div className="mx-4 mb-10 rounded-md bg-red-50 p-4 lg:mx-6 xl:mx-8">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      </div>
    </div>
  );
}

type Slug = "dates" | "trip";
function isSlug(value: string): value is Slug {
  return value === "dates" || value === "trip";
}
export default function Home({ params }: { params: { slug: Slug } }) {
  const [isValidSlug, setIsValidSlug] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>("questions");
  const [answer, setAnswer] = useState<string>('');
  const [plan, setPlan] = useState("");
  const [start, setStart] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [error, setError] = useState<string | null>("");

  useEffect(() => {
    if (isSlug(params.slug)) setIsValidSlug(true);
    else setIsValidSlug(false);
  },[params.slug]);

  if (!isValidSlug) return <PageNotFound />;

  const BASE_URL_CHAT = process.env.BASE_URL_CHAT_AGENT_PY;
  if(!BASE_URL_CHAT) throw Error('not BASE_URL_CHAT ...');

  async function handleStart() {
    try {
      const res = await fetch(BASE_URL_CHAT + '/start_flow', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({slug: params.slug}),
      });
  
      const { session_id, question} = await res.json();

      console.log({session_id});

      if(!session_id && !question) throw Error('no session_id, or question');

      setSessionId(session_id);
      setQuestion(question);
      setStart(true);
    } catch (error: any) {
      console.error(error.message);
      setError(`${error.message}`);
    }
  }

  async function handleAnswer() {
    if(!answer) {
      alert('please answer the question ...');
      return;
    }
    try {
      const params = {
        answer,
      }

      const response = await fetch(BASE_URL_CHAT+'/answer'+`/${sessionId}`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params),
      });
      
      const {next_question, trip_plan} = await response.json();

      console.log({next_question});

      if(next_question) {
        setAnswer('');
        setQuestion(next_question);
      } else if(trip_plan) {
        console.log({trip_plan});
        setPlan(trip_plan);
      } else {
        throw Error('no next_question or trip_plan');
      }
    } catch (error: any) {
      console.error(error.message);
    }
  }

  return (
    <div className="lg:pl-72 flex flex-col min-h-screen justify-center">
      {error ? <ErrorNotification errorMessage={error} /> : null}
      {start && <div className="mx-auto flex flex-col gap-2">
        <label htmlFor="answer">{question}</label>
        <textarea name="anwer" id="answer" className="bg-inherit border"
          onChange={(e) => setAnswer(e.target.value)} 
          value={answer}
        />
        <button className="border flex flex-row justify-center gap-2 p-1 items-center hover:bg-blue-950"
          onClick={handleAnswer}
        >
          Send 
          <PaperAirplaneIcon className="h-5 w-5 shrink-0" />
        </button>
      </div>}
      {!start && 
        <div className='mx-auto'>
          <button 
          className="border flex flex-row min-w-[200px] justify-center gap-2 p-2 items-center hover:bg-blue-950"
          onClick={handleStart}
          >
            {params.slug}
            <PaperAirplaneIcon className="h-5 w-5 shrink-0" />
          </button>
        </div>
      }
      {plan && <div className='mx-auto p-6 border rounded '>
        <ReactMarkdown>{plan}</ReactMarkdown>
      </div>}
    </div>
  )
}