
export enum Tone {
  Professional = 'Professional',
  Witty = 'Witty',
  Urgent = 'Urgent',
}

export type SocialPlatform = 'LinkedIn' | 'Twitter' | 'Instagram';

export interface PostContent {
  platform: SocialPlatform;
  text: string;
  image_prompt: string;
}

export interface GenerationResult extends PostContent {
  imageUrl: string;
}

export type AspectRatio = '4:3' | '16:9' | '1:1';
