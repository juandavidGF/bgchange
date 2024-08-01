import { Configurations } from "@/types";

export const configurations: Configurations = {
  'tryon': {
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
      { type: 'text', placeholder: 'Your name', key: 'outputName' },
      { type: 'image', placeholder: 'Your profile picture', key: 'outputProfilePicture', show: true },
    ],
  },
  'sam2': {
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
  },
};
