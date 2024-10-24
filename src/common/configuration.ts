import { Configurations } from "@/types";

const configurationsObj: Configurations = [
  {
    name: 'tryon',
    type: 'gradio',
    client: "yisol/IDM-VTON",
    path: "/tryon",
    inputs: [
      { type: 'image', placeholder: 'Enter your name', key: 'garm_img', gradioName: 'garm_img', show: true },
      { type: 'image', placeholder: 'Upload your profile picture', key: 'Human', show: true },
      { type: 'prompt', label: 'Description of the garment', key: 'garment_des', value: 'Hello!!', show: true },
      { type: 'checkbox', placeholder: 'Is checked?', key: 'is_checked', value: true, show: false },
      { type: 'checkbox', placeholder: 'Is checked crop?', key: 'is_checked_crop', value: false, show: false },
      { type: 'number', placeholder: 'Denoise Steps', key: 'denoise_steps', value: 30, show: false },
      { type: 'number', placeholder: 'Seed', key: 'seed', value: 42, show: false }
    ],
    outputs: [
      { type: 'text', placeholder: 'Your name', key: 'outputName', show: false },
      { type: 'image', placeholder: 'Your profile picture', key: 'outputProfilePicture', show: true },
    ],
  },
  {
    name: 'sam2',
    type: 'replicate',
    model: 'meta/sam-2',
    version: 'fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83',
    inputs: [
      { type: 'image', key: 'image', placeholder: 'Upload your image', show: true },
      { type: 'checkbox', key: 'use_m2m', value: true },
      { type: 'number', key: 'points_per_side', value: 32 },
      { type: 'number', key: 'pred_iou_thresh', value: 0.88 },
      { type: 'number', key: 'stability_score_thresh', value: 0.95 },
    ],
    outputs: [
      { type: 'image', placeholder: 'Segmented Image, combined mask', key:'combined_mask', show: true },
    ],
  },{
    name: 'pyramid-flow',
    type: 'gradio',
    client: 'Pyramid-Flow/pyramid-flow',
    path: '/generate_video',
    inputs: [
      { component: 'prompt', type: 'string', key: 'prompt', value: null, show: true},
      { component: 'image', type: 'string', key: 'image', value: null, show: true},
      { component: 'prompt', type: 'integer', key: 'duration', value: 1, show: false},
    ],
    outputs: [
    ]
  }
  {
    name: 'EVF-SAM',
    type: 'gradio',
    client: 'wondervictor/evf-sam',
    path: '/predict',
    inputs: [
      { component: 'image', type: 'image', key: 'image_np', value: null, show: true },
      { type: 'prompt', key: 'prompt', label: 'Prompt', description: 'Use a phrase or sentence to describe the object you want to segment. Currently we only support English', value: null, show: true },
    ],
    outputs: [
      { type: 'image', placeholder: 'Visualitation', key:'visulization', show: true },
      { type: 'image', placeholder: 'mask', key:'mask', show: true },
    ],
  },
  {
    name: 'Hivision',
    type: 'gradio',
    client: 'TheEeeeLin/HivisionIDPhotos',
    path: '/idphoto_inference',
    inputs: [
      { component: 'image', type: 'string', key: 'input_image', value: 'https://theeeeelin-hivisionidphotos.hf.space/file=/tmp/gradio/5bf86fbc980e461b32c5e52a47b8f5c0909f27e3ab146f7e0155e72f49be4e06/test2.jpg', show: true },
      { component: 'prompt', type: 'string', key: 'mode_option', label: 'Mode Option', value: "Size List", show: false }, // Added component and changed show to false
      { component: 'prompt', type: 'string', key: 'size_list_option', label: 'Size List Option', value: "One inch (413, 295)", show: false }, // Added component and changed show to false
      { component: 'prompt', type: 'string', key: 'color_option', label: 'Color Option', value: "Blue", show: true }, // Added component and changed show to false
      { component: 'prompt', type: 'string', key: 'render_option', label: 'Render Option', value: "Solid Color", show: false }, // Added component and changed show to false
      { component: 'prompt', type: 'string', key: 'image_kb_options', label: 'Image KB Options', value: "Not Set", show: false },
      { component: 'number', type: 'integer', key: 'custom_color_R', value: 0, show: false },
      { component: 'number', type: 'integer', key: 'custom_color_G', value: 0, show: false },
      { component: 'number', type: 'integer', key: 'custom_color_B', value: 0, show: false },
      { component: 'number', type: 'integer', key: 'custom_size_height', value: 413, show: false }, // Added component and changed show to false
      { component: 'number', type: 'integer', key: 'custom_size_width', value: 295, show: false }, // Added component and changed show to false
      { component: 'number', type: 'integer', key: 'custom_image_kb', value: 50, show: false }, // Added component and changed show to false
      { component: 'prompt', type: 'string', key: 'language', label: 'Language', value: "English", show: false }, // Added component and changed show to false
      { component: 'prompt', type: 'string', key: 'matting_model_option', label: 'Matting Model Option', value: "modnet_photographic_portrait_matting", show: false }, // Added component and changed show to false
    ],
    outputs: [
      { component: 'image', type: 'string', placeholder: 'Visualitation', key:'visulization', show: true },
      { component: 'image', type: 'string', placeholder: 'mask', key:'mask', show: true },
    ],
  },
  {
    name: 'FineGrainImageEnhancer',
    type: 'gradio',
    client: 'finegrain/finegrain-image-enhancer',
    path: '/process',
    inputs: [
      { component: 'image', type: 'string', key: 'input_image', value: null, show: true }, // Added input for image
      { component: 'prompt', type: 'string', key: 'prompt', value: "Hello!!", show: false },
      { component: 'prompt', type: 'string', key: 'negative_prompt', value: "Hello!!", show: false },
      { component: 'number', type: 'integer', key: 'seed', value: 0, show: false },
      { component: 'number', type: 'integer', key: 'upscale_factor', value: 1, show: false },
      { component: 'number', type: 'integer', key: 'controlnet_scale', value: 0, show: false },
      { component: 'number', type: 'integer', key: 'controlnet_decay', value: 0.5, show: false },
      { component: 'number', type: 'integer', key: 'condition_scale', value: 2, show: false },
      { component: 'number', type: 'integer', key: 'tile_width', value: 64, show: false },
      { component: 'number', type: 'integer', key: 'tile_height', value: 64, show: false },
      { component: 'number', type: 'integer', key: 'denoise_strength', value: 0, show: false },
      { component: 'number', type: 'integer', key: 'num_inference_steps', value: 1, show: false },
      { component: 'prompt', type: 'string', key: 'solver', value: "DDIM", show: false },
    ],
    outputs: [
      { component: 'image', type: 'string', placeholder: 'Processed Image', key: 'output_image', show: true },
    ],
  },
  {
    name: 'consistent-character',
    type: 'replicate',
    model: 'fofr/consistent-character',
    version: '9c77a3c2f884193fcee4d89645f02a0b9def9434f9e03cb98460456b831c8772',
    inputs: [
      { component: 'prompt', type: 'string', key: 'prompt', label: 'Prompt', description: 'the prompt to generate the character', value: 'A closeup headshot photo of a young woman in a grey sweater', show: true },
      { component: 'image', type: 'string', key: 'subject', value: 'https://replicate.delivery/pbxt/L0gy7uyLE5UP0uz12cndDdSOIgw5R3rV5N6G2pbt7kEK9dCr/0_3.webp', show: true },
      { component: 'prompt', type: 'string', key: 'output_format', value: 'webp', show: false },
      { component: 'prompt', type: 'integer', key: 'output_quality', value: 80, show: false },
      { component: 'prompt', type: 'string', key: 'negative_prompt', value: "", show: false },
      { component: 'prompt', type: 'boolean', key: 'randomise_poses', value: true, show: false },
      { component: 'number', type: 'boolean', key: 'number_of_outputs', label: 'number of outputs', value: 5, show: false },
      { component: 'number', type: 'boolean', key: 'number_of_images_per_pose', label: 'number of images per pose', value: 1, show: false },
    ],
    outputs: [
      { component: 'image', type: 'array', typeItem: 'string', format: 'uri', placeholder: 'characther', key:'output', show: true },
    ],
  },
]

// New function to fetch configurations
async function fetchConfigurations(timestamp?: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/create/get${timestamp ? `?timestamp=${timestamp}` : ''}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error('Failed to fetch configurations');
    return response.json();
  } catch (error) {
    console.error('Error fetching configurations:', error);
    return null;
  }
}

// Combine local configurations with fetched configurations
async function getConfigurations(forceRefresh: boolean = false): Promise<Configurations> {
  const timestamp = forceRefresh ? Date.now() : undefined;
  const fetchedConfigurations = await fetchConfigurations(timestamp);
  console.log({fetchedConfigurations});
  return fetchedConfigurations ? [...configurationsObj, ...fetchedConfigurations] : configurationsObj;
}

export  {getConfigurations};