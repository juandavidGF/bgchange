"use client";

import Dropzone from "react-dropzone";
import { saveAs } from "file-saver";
import { useState, useEffect, useCallback } from "react";
import { FileRejection } from "react-dropzone";
import { ThreeDots } from "react-loader-spinner";
import { FaTrashAlt } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { PhotoIcon, FaceSmileIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { SelectMenu } from "@/app/selectmenu";
import { Configuration, ImageAreaProps, InputItem, OutputItem } from "@/types";
import { sleep } from "@/utils";
import { Prompt } from "@/components/prompt";
import { Slider, Checkbox, CheckboxGroup, NumberInput, NumberOutput } from "@/components/numericInput";
import { AudioOutput } from "@/components/audioOutput";
import { TextOutput } from "@/components/textOutput";
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getConfigurations } from '@/common/configuration';

type ErrorNotificationProps = {
  errorMessage: string;
};

type ActionPanelProps = {
  isLoading: boolean;
  submitImage(): void;
};

type UploadedImageProps = {
  image: File;
  removeImage(): void;
  file: {
    name: string;
    size: string;
  };
};

type UploadedVideoProps = {
  video: File;
  removeVideo(): void;
  file: {
    name: string;
    size: string;
  };
};

type ImageOutputProps = ImageAreaProps & {
  loading: boolean;
  outputImage: string | null;
  downloadOutputImage(): void;
};

const sources = ["None", "Left Light", "Right Light", "Bottom Light", "Top Light"];

const acceptedFileTypes = {
  "image/jpeg": [".jpeg", ".jpg", ".png"],
};

const acceptedVideoTypes = {
  "video/*": [".jpeg", ".jpg", ".png"],
};

const maxFileSize = 5 * 1024 * 1024; // 5MB
const maxVideoSize = 100 * 1024 * 1024; // 100MB

/**
 * Display an error notification
 * @param {ErrorNotificationProps} props The component props
 */
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

/**
 * Display the action panel
 * @param {ActionPanelProps} props The component props
 */
function ActionPanel({ isLoading, submitImage }: ActionPanelProps) {
  const isDisabled = isLoading;

  return (
    <section className="mx-4 bg-gray-900 shadow sm:rounded-lg lg:mx-6 xl:mx-8">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold leading-6 text-gray-300 lg:text-xl">
              Upload a photo or image
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Upload an image of a room and let our AI generate a new design.
              </p>
            </div>
          </div>
          <div className="mt-5 sm:ml-6 sm:mt-0 sm:flex sm:flex-shrink-0 sm:items-center">
            <button
              type="button"
              disabled={isDisabled}
              onClick={submitImage}
              className={`${
                isDisabled
                  ? "cursor-not-allowed bg-indigo-300 text-gray-300 hover:bg-indigo-300 hover:text-gray-300"
                  : "bg-indigo-600 text-white"
              } inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-300 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:px-3.5 lg:py-2.5`}
            >
              Design
              <SparklesIcon className="ml-2 h-4 w-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Display the image output
 * @param {ImageOutputProps} props The component props
 */
function ImageOutput(props: ImageOutputProps) {
  return (
    <section className="relative min-h-[206px] w-full">
      <button
        type="button"
        className={`${
          props.loading ? "flex items-center justify-center" : ""
        } relative block h-full w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      >
        {!props.outputImage && props.loading ? (
          <span className="flex flex-col items-center">
            <ThreeDots
              height="50"
              width="60"
              color="#eee"
              ariaLabel="three-dots-loading"
              visible={props.loading}
            />
            <span className="block text-sm font-semibold text-gray-300">
              Processing the output image
            </span>
          </span>
        ) : null}

        {!props.outputImage && !props.loading ? (
          <>
            <props.icon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold text-gray-300">
              {props.title}
            </span>
          </>
        ) : null}

        {!props.loading && props.outputImage ? (
          <img
            src={props.outputImage}
            alt="output"
            className="h-full w-full object-cover"
          />
        ) : null}
      </button>

      {!props.loading && props.outputImage ? (
        <button
          onClick={props.downloadOutputImage}
          className="group absolute right-1 top-1 bg-yellow-500 p-2 text-black"
        >
          <FaDownload className="h-4 w-4 duration-300 group-hover:scale-110" />
        </button>
      ) : null}
    </section>
  );
}

/**
 * Display the uploaded image
 * @param {UploadedImageProps} props The component props
 */
function UploadedImage({ file, image, removeImage }: UploadedImageProps) {
  return (
    <section className="relative min-h-[206px] w-full m-3">
      <button className="relative block h-full w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        <img
          src={URL.createObjectURL(image)}
          alt={image.name}
          className="h-full w-full object-cover"
        />
      </button>

      <button
        className="group absolute right-1 top-1 rounded bg-yellow-500 p-2 text-black z-10"
        onClick={removeImage}
      >
        <FaTrashAlt className="h-4 w-4 duration-300 group-hover:scale-110" />
      </button>

      <div className="text-md absolute left-0 top-0 bg-opacity-50 p-2 pl-3.5 text-white">
        {file.name} ({file.size})
      </div>
    </section>
  );
}

/**
 * Display the uploaded image
 * @param {UploadedVideoProps} props The component props
 */
function UploadedVideo({ file, video, removeVideo }: UploadedVideoProps) {
  return (
    <section className="relative min-h-[206px] w-full">
      <button className="relative block h-full w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        <video
          src={URL.createObjectURL(video)}
          className="h-full w-full object-cover"
          controls
          autoPlay
        />
      </button>

      <button
        className="group absolute right-1 top-1 rounded bg-yellow-500 p-2 text-black z-10"
        onClick={removeVideo}
      >
        <FaTrashAlt className="h-4 w-4 duration-300 group-hover:scale-110" />
      </button>

      <div className="text-md absolute left-0 top-0 bg-opacity-50 p-2 pl-3.5 text-white">
        {file.name} ({file.size})
      </div>
    </section>
  );
}

/**
 * Display the image dropzone
 * @param {ImageAreaProps} props The component props
 */
function ImageDropzone(
  props: ImageAreaProps & {
    onImageDrop(acceptedFiles: File[], rejectedFiles: FileRejection[], id: number): void;
  }
) {
  return (
    <Dropzone
      onDrop={(acceptedFiles, rejectedFiles) => props.onImageDrop(acceptedFiles, rejectedFiles, props.id as number)}
      accept={acceptedFileTypes}
      maxSize={maxFileSize}
      multiple={false}
    >
      {({ getRootProps, getInputProps }) => (
        <>
          <input {...getInputProps()} />
          <button
            {...getRootProps()}
            type="button"
            className="relative block min-h-[206px] w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <props.icon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold text-gray-300">
              {props.title}
            </span>
          </button>
        </>
      )}
    </Dropzone>
  );
}

/**
 * Display the image dropzone
 * @param {ImageAreaProps} props The component props
 */
function VideoDropzone(
  props: ImageAreaProps & {
    onVideoDrop(acceptedFiles: File[], rejectedFiles: FileRejection[]): void;
  }
) {
  return (
    <Dropzone
      onDrop={props.onVideoDrop}
      accept={{
        "video/*": [".mp4"],
      }}
      maxSize={maxVideoSize}
      multiple={false}
    >
      {({ getRootProps, getInputProps }) => (
        <>
          <input {...getInputProps()} />
          <button
            {...getRootProps()}
            type="button"
            className="relative block min-h-[206px] w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <props.icon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold text-gray-300">
              {props.title}
            </span>
          </button>
        </>
      )}
    </Dropzone>
  );
}

interface ModelInput {
  prompt: boolean;
  image: number;
  video: boolean;
  select: boolean;
}

interface ModelOutput {
  image: boolean;
  video: boolean;
}

interface Model {
  input: ModelInput;
  output: ModelOutput;
}

function layout({slug}: {slug: string}): { model: Model } {
  let model: Model = {
    input: {
      prompt: false,
      image: 0,
      video: false,
      select: false,
    },
    output: {
      image: false,
      video: false,
    }
  }

  switch(slug) {
    case "createVideo":
      model.input.prompt = model.output.video = true;
      break;
    case "upscaler":
      model.input.image = 1;
      model.output.image = true;
      break;
    case "hairStyle":
      model.input.image = 1;
      model.output.image 
        = model.input.prompt
        = true;
      break;
    case "livePortrait":
      model.input.image = 1;
      model.input.video = true;
      model.output.video = true;
      break;
    default:
      break;
  }

  return {model};
}

type Slug = "createVideo" | "freshink" | "hairStyle" | "upscaler" | "livePortrait" | 'tryon' | 'logo' | 'EVF-SAM';
type Status = "starting" | "processing" | "succeeded" | "failed" | "canceled";
/**
 * Display the home page
 */
export default function ClientPage({ slug, initialConfigurations }: { slug: Slug, initialConfigurations: Configuration[] }) {
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [outputImage, setOutputImage] = useState<string[] | null>(null);
  const [base64Images, setBase64Images] = useState<string[]>([]);
  const [outputVideo, setOutputVideo] = useState<string | null>(null);
  const [base64Video, setBase64Video] = useState<string | null>(null);
  const [source, setSource] = useState<string>(sources[0]);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>("");
  const [files, setFiles] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);

  const fetchConfig = useCallback(async () => {
    const configurations = await getConfigurations();
    const foundConfig = configurations.find(conf => conf.name === slug);
    if (foundConfig) {
      setConfig(foundConfig);
      setLoading(false);
    } else if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [slug, retryCount]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (!loading && !config) {
      window.location.reload();
    }
  }, [loading, config]);

  if (loading) {
    return <div>Loading... Attempt {retryCount + 1} of 3</div>;
  }

  if (!config) {
    return notFound();
  }

  console.log({config});

  const {model} = layout({slug});
  
  let contImg = 0;

  /**
   * Handle the image drop event
   * @param {Array<File>} acceptedFiles The accepted files
   * @param {Array<FileRejection>} rejectedFiles The rejected files
   * @returns void
   */
  function onImageDrop(
    acceptedFiles: File[],
    rejectedFiles: FileRejection[],
    id: number,
  ): void {
    // Check if any of the uploaded files are not valid
    if (rejectedFiles.length > 0) {
      console.info(rejectedFiles);
      setError(`Please upload a PNG or JPEG image less than ${maxFileSize}MB.`);
      return;
    }

    removeImage();

    console.info(acceptedFiles);
    setError("");
    setFiles((prevFiles) => ({ ...prevFiles, [id]: acceptedFiles[0] }));

    // Convert to base64
    convertImageToBase64(acceptedFiles[0], id);
  }

  function onVideoDrop(
    acceptedFiles: File[],
    rejectedFiles: FileRejection[]
  ): void {
    // Check if any of the uploaded files are not valid
    if (rejectedFiles.length > 0) {
      console.info(rejectedFiles);
      setError(`Please upload a MP4 video less than ${maxVideoSize}MB.`);
      return;
    }

    removeVideo();

    console.info(acceptedFiles);
    setError("");
    setVideo(acceptedFiles[0]);

    // Convert to base64
    convertVideoToBase64(acceptedFiles[0]);
  }

  /**
   * Convert the image to base64
   * @param {File} file The file to convert
   * @returns void
   */
  function convertImageToBase64(file: File, id: number): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const binaryStr = reader.result as string;
      setBase64Images(prevImg => ({...prevImg, [id]: binaryStr}));
    };
  }

  function convertVideoToBase64(file: File): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const binaryStr = reader.result as string;
      setBase64Video(binaryStr);
    };
  }

  /**
   * Convert the file size to a human-readable format
   * @param {number} size The file size
   * @returns {string}
   */
  function fileSize(size: number): string {
    if (size === 0) {
      return "0 Bytes";
    }

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));

    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Remove the uploaded image
   * @returns void
   */
  function removeImage(id?: number): void {
    // setFiles((prevFiles) => ({ ...prevFiles, [id]: null }));
    setOutputImage(null);
  }

  /**
   * Remove the uploaded video
   * @returns void
   */
  function removeVideo(): void {
    setVideo(null);
    setOutputVideo(null);
  }

  /**
   * Download the output image
   * @returns void
   */
  function downloadOutputImage(): void {
    if (outputImage && Array.isArray(outputImage) && outputImage.length > 0) {
      saveAs(outputImage[0], "output.png"); // Use the first image in the array
    }
  }

  /**
   * Submit the image to the server
   * @returns {Promise<void>}
   */
  async function submitImage({slug}: {slug: Slug}): Promise<void> {
    const params: any = { prompt, image: base64Images, video: base64Video };
    
    if (config?.inputs) {
      let imgI = 0;
      for (const [key, value] of Object.entries(config.inputs)) {
        if (value.show) {
          const {component} = value;
          if (component === 'image') {
            if(!params[component][imgI]) {
              alert(`must to fill the ${component} ${imgI}`)
              return;
            }
            imgI++;
          } else if(params[component]) {
            console.log(`${component} ${imgI} filled`);
          } else {
            alert(`must to fill the ${component}`)
            return;
          }
        }
      }
    }
    
    for (const [key, value] of Object.entries(model.input)) {
      if (value) {
        if (typeof value === 'number') {
          for(let i= 0; i < value ;i++) {
            if (params[key][i]) { 
              console.log('Ok', {key, i});
            } else {
              console.log('alert', key, params[key]);
              setError(`Must fill the field ${key} ${value}`);
              return; // Exit the function early
            }
          }
        } else {
          if (params[key]) {
            console.log('Ok', key);
          } else {
            console.log('alert', key, params[key]);
            setError(`Must fill the field ${key}`);
            return;
          }
        }
      }
    }

    setLoading(true);

    let prediction: any;

    if (slug === 'EVF-SAM') {
      if(!prompt) {
        alert('Please upload the files.');
        return;
      }
      if (initialConfigurations) {
        const evfSamConfig = initialConfigurations.find(conf => conf.name === 'EVF-SAM');
        if (evfSamConfig) {
          const formData = new FormData();
          formData.append(evfSamConfig.inputs[0].key, files[0]);
          formData.append(evfSamConfig.inputs[1].key, prompt);

          console.log('flag1', {formData});

          const response = await fetch(`/api/app/${slug}`, {
            method: "POST",
            body: formData,
          });
          if (response.status !== 201) {
            console.log('err ', {response})
            setError("error");
            setLoading(false);
            return;
          }
          console.log('flag2');
          
          const responseJSON = await response.json();
          console.log('flag3', {responseJSON})

          console.log({responseJSON});
          
          prediction = {
            state: {
              output: responseJSON[0].url,
            }
          }
        }
      }
    } else {
      let response: any;
      let result: any;
      let status: Status | null = null;


      const genA = await fetch(`/api/app/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      console.log({genA});
  
      const {id} = await genA.json();
  
      if (!genA.ok) {
        setError(genA.statusText);
        setLoading(false);
        return;
      }
      
      do {
        await sleep(1_000);
        response = await fetch(`/api/app/${slug}/get`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });
        result = await response.json();
        
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
  
        status = result.state.status;
  
        console.log({status});
      } while (status !== 'succeeded' && status !== 'failed');
      
      if (status === 'failed') throw Error("status failed");
      prediction = result;
    }
    
    
    if (config && config.outputs) {
      console.log({outputs: config.outputs});
      config.outputs.forEach((item: OutputItem) => {
        const {component} = item; // Change 'type' to 'component'
        if (component === 'image') { // Update the condition to check 'component'
          if (Array.isArray(prediction.state.output)) { // Check if output is an array
            setOutputImage(prediction.state.output); // Set the entire array
          } else if (typeof prediction.state.output === 'string') {
            setOutputImage([prediction.state.output]); // Wrap single string in an array
          } else {
            console.error('Invalid output format');
            throw Error('Invalid output format');
          }
        } else if (component === 'video') {
          if (config?.outputs && config.outputs.length > 0) {
            const key = config.outputs[0].key;
            setOutputVideo(prediction.state.output[key]);
          } else {
            console.error('Invalid key');
            throw Error('Invalid key');
          }
        }
      })
    }

    if(model.output.video) {
      console.log({prediction});
      const videox = prediction.state.output ? prediction.state.output[0] : null;
      console.log({videox})
      setOutputVideo(videox);
    } else if(model.output.image) {
      setOutputImage(prediction.output[0]);
    }

    setLoading(false);
  }
  
  return (
    <main className="flex min-h-screen flex-col py-10 lg:pl-72">
      {error ? <ErrorNotification errorMessage={error} /> : null}
      <ActionPanel isLoading={loading} submitImage={() => submitImage({slug})} />
      
      <div className="flex flex-row">
        <div className="flex flex-col w-1/2">
          <h1 className="mx-auto">Input</h1>
          <section className="mx-4 mt-9 flex flex-col space-y-8 lg:mx-6 gap-4 lg:space-x-8 lg:space-y-0 xl:mx-8">
            {config?.inputs.map((item: InputItem, index: number) => {
              if (('show' in item) && item['show']) {
                const { component } = item;
                switch (component.toLowerCase()) {
                  case 'image':
                    const Img = !files[contImg] ? 
                      (<ImageDropzone
                        key={index}
                        id={contImg}
                        title={`Drag 'n drop your image here or click to upload`}
                        onImageDrop={onImageDrop}
                        icon={slug === 'hairStyle' ? FaceSmileIcon : PhotoIcon}
                      />)
                      :
                      (<UploadedImage
                        key={index}
                        image={files[contImg]}
                        removeImage={() => removeImage(contImg)}
                        file={{ name: files[contImg].name, size: fileSize(files[contImg].size) }}
                      />)
                      
                    
                    contImg += 1;
                    return Img;
                  case 'prompt':
                    return(
                      <Prompt
                        key={index}
                        label={item.label as string}
                        placeholder={item.placeholder as string} 
                        description={item.description as string}
                        placeholderTextArea={item.value as string}
                        setPrompt={setPrompt}
                      />)
                  case 'textbox':
                    return(
                      <Prompt
                        key={index}
                        label={item.label as string}
                        placeholder={item.placeholder as string} 
                        description={item.description as string}
                        placeholderTextArea={item.value as string}
                        setPrompt={setPrompt}
                      />)
                  case 'number':
                    return (
                      <NumberInput
                        key={index}
                        label={item.label as string || 'Value'}
                        description={item.description as string}
                        min={Number(item.min) || 0}
                        max={Number(item.max) || 100}
                        step={Number(item.step) || 1}
                        defaultValue={Number(item.value) || 50}
                        onChange={(value) => setPrompt(value.toString())}
                      />
                    )
                  case 'slider':
                    return (
                      <Slider
                        key={index}
                        label={item.label as string}
                        description={item.description as string}
                        min={item.min as number || 0}
                        max={item.max as number || 100}
                        step={item.step as number || 1}
                        defaultValue={item.value as number || 50}
                        onChange={(value) => setPrompt(value.toString())}
                      />
                    )
                  case 'checkbox':
                    return (
                      <Checkbox
                        key={index}
                        label={item.label as string}
                        description={item.description as string}
                        defaultChecked={item.value as boolean}
                        onChange={(checked) => setPrompt(checked.toString())}
                      />
                    )
                  case 'checkboxgroup':
                    return (
                      <CheckboxGroup
                        key={index}
                        label={item.label as string}
                        description={item.description as string}
                        options={item.options as string[] || []}
                        defaultSelected={(item.value as string[]) || []}
                        onChange={(selected) => setPrompt(JSON.stringify(selected))}
                      />
                    )
                  case 'dropdown':
                    return (
                      <SelectMenu
                        key={index}
                        label={item.label as string}
                        options={item.options as string[] || []}
                        selected={(item.value as string) || (item.options as string[])?.[0] || ''}
                        onChange={(value) => setPrompt(value)}
                      />
                    )
                  default:
                    return <div>no supported {item.key} type {component}</div>;
                }
              }
            })}
            {model.input.prompt && 
              <div className="w-80">
                <label className="block text-sm font-medium leading-6 text-gray-300">
                  Prompt,
                  <br/>
                  {slug === 'freshink' ? 
                    ("describe the tatto you want to create")
                      : slug === 'createVideo'
                        ? "describe the video you want to create"
                        : "describe the hair style"
                  }
                </label>
                <textarea
                  className="mt-2 w-full border bg-slate-800 text-sm text-gray-300 leading-6 text-left pl-3 py-1 rounded-md"
                  placeholder={
                    slug === 'freshink' ? 
                      ("A fresh ink TOK tattoo") 
                        : slug === 'createVideo' 
                          ? "bonfire, on the stone"
                          : "a face with a bowlcut"
                    }
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            }
            {model.input.select && <SelectMenu
                label="Light Source"
                options={sources}
                selected={source}
                onChange={setSource}
              />
            }
            {
              Array.from({ length: model.input.image }).map((_, index) => (
                !files[index] ? (
                  <ImageDropzone 
                    key={index}
                    id={index}
                    title={`Drag 'n drop your image here or click to upload`}
                    onImageDrop={onImageDrop}
                    icon={slug === 'hairStyle' ? FaceSmileIcon : PhotoIcon}
                  />
                ) : (
                  <UploadedImage
                    key={index}
                    image={files[index]}
                    removeImage={() => removeImage(index)}
                    file={{ name: files[index].name, size: fileSize(files[index].size) }}
                  />
                )
              ))
            }

            {model.input.video && (
              !video ? (
                <VideoDropzone
                  title={`Drag 'n drop your video here or click to upload`}
                  onVideoDrop={onVideoDrop}
                  icon={VideoCameraIcon}
                />
              ) : (
                <UploadedVideo
                  video={video}
                  removeVideo={removeVideo}
                  file={{ name: video.name, size: fileSize(video.size) }}
                />
              )
            )}
          </section>
        </div>

        <div className="flex flex-col w-1/2">
          <h1 className="mx-auto">Output</h1>
          <section className="mx-4 mt-9 flex flex-col gap-4">
            {config && config.outputs && config.outputs.map((item: OutputItem, index: number) => {
              if (('show' in item) && item['show']) {
                if (item.type === 'array' && item.format === 'uri') {
                  // Check if outputImage is an array and has items
                  if (Array.isArray(outputImage) && outputImage.length > 0) {
                    return (
                      <div key={index} className="flex flex-col">
                        {outputImage.map((imgUri, imgIndex) => (
                          <ImageOutput
                            key={imgIndex}
                            title={item.title || 'Output'}
                            downloadOutputImage={downloadOutputImage}
                            outputImage={imgUri} // Use each URI for the ImageOutput
                            icon={SparklesIcon}
                            loading={loading}
                          />
                        ))}
                      </div>
                    );
                  } else {
                    // Show a placeholder or loading state before generation
                    return (
                      <ImageOutput
                        key={index}
                        title={item.title || 'Output'}
                        downloadOutputImage={downloadOutputImage}
                        outputImage={null} // Placeholder before generation
                        icon={SparklesIcon}
                        loading={loading}
                      />
                    );
                  }
                }

                switch (item.component.toLowerCase()) {
                  case 'image':
                    return <ImageOutput
                      key={index}
                      title={item.placeholder as string}
                      downloadOutputImage={downloadOutputImage}
                      outputImage={Array.isArray(outputImage) ? outputImage[0] : outputImage} // Ensure outputImage is a string or null
                      icon={SparklesIcon}
                      loading={loading}
                    />
                  case 'video':
                    return <video
                      key={index}
                      src={outputVideo as string}
                      width="520"
                      height="340"
                      controls
                      autoPlay
                      className="h-full w-full object-cover"
                    >
                      Your browser does not support the video tag.
                    </video>
                  case 'audio':
                    return (
                      <AudioOutput
                        key={index}
                        title={item.title || 'Audio Output'}
                        audioUrl={item.value as string || null}
                      />
                    )
                  case 'number':
                    return (
                      <NumberOutput
                        key={index}
                        title={item.title || 'Numeric Output'}
                        value={item.value || null}
                      />
                    )
                  case 'textbox':
                    return (
                      <TextOutput
                        key={index}
                        title={item.title}
                        placeholder={item.placeholder}
                        value={item.value}
                      />
                    )
                  default:
                    return <div>no supported {item.component} type</div>;
                }
              }
            })}

            {model.output.image && (
              <ImageOutput
                title={`AI-generated output goes here`}
                downloadOutputImage={downloadOutputImage}
                outputImage={Array.isArray(outputImage) ? outputImage[0] : outputImage} // Ensure outputImage is a string or null
                icon={SparklesIcon}
                loading={loading}
              />
            )}
            {model.output.video && (
              <video
                src={outputVideo as string}
                width="520"
                height="340"
                controls
                autoPlay
                className="h-full w-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
