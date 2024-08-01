import { Configurations } from "@/types";

export const configurations: Configurations = {
  'tryon': {
    type: 'gradio',
    client: "yisol/IDM-VTON",
    path: "/tryon",
    inputs: [
      { type: 'image', placeholder: 'Enter your name', name: 'garm_img', gradioName: 'garm_img', show: true },
      { type: 'image', placeholder: 'Upload your profile picture', name: 'Human', show: true },
      { type: 'prompt', label: 'Description of the garment', name: 'garment_des', value: 'Hello!!', show: true },
      { type: 'checkbox', placeholder: 'Is checked?', name: 'is_checked', value: true, show: false },
      { type: 'checkbox', placeholder: 'Is checked crop?', name: 'is_checked_crop', value: false, show: false },
      { type: 'number', placeholder: 'Denoise Steps', name: 'denoise_steps', value: 30, show: false },
      { type: 'number', placeholder: 'Seed', name: 'seed', value: 42, show: false }
    ],
    outputs: [
      { type: 'text', placeholder: 'Your name', key: 'outputName' },
      { type: 'image', placeholder: 'Your profile picture', key: 'outputProfilePicture' },
    ],
  },
  'app2': {
    endpoint: '/api/endpoint2',
    model: 'Model2',
    inputs: [
      { type: 'video', placeholder: 'Upload your introduction video', key: 'introVideo' },
      { type: 'text', placeholder: 'Enter your bio', key: 'bio' },
    ],
    outputs: [
      { type: 'text', placeholder: 'Your bio', key: 'outputBio' },
      { type: 'video', placeholder: 'Your introduction video', key: 'outputIntroVideo' },
    ],
  },
  'app3': {
    endpoint: '/api/endpoint3',
    model: 'Model3',
    inputs: [
      { type: 'text', placeholder: 'Enter your feedback', key: 'feedback' },
    ],
    outputs: [
      { type: 'text', placeholder: 'Thank you for your feedback', key: 'outputFeedback' },
    ],
  },
  'app4': {
    endpoint: '/api/endpoint4',
    model: 'Model4',
    inputs: [
      { type: 'text', placeholder: 'Enter product name', key: 'productName' },
      { type: 'image', placeholder: 'Upload product image', key: 'productImage' },
      { type: 'select', placeholder: 'Choose product category', key: 'productCategory', options: ['Electronics', 'Books', 'Clothing'] },
    ],
    outputs: [
      { type: 'text', placeholder: 'Product name', key: 'outputProductName' },
      { type: 'image', placeholder: 'Product image', key: 'outputProductImage' },
    ],
  },
  // Add more configurations as needed
};
