declare module 'emoji-picker-react' {
  import type { FC } from 'react';

  export type EmojiStyle = 'native' | 'apple' | 'google' | 'twitter' | 'facebook';
  export type Theme = 'light' | 'dark' | 'auto';

  export interface EmojiClickData {
    emoji: string;
    names: string[];
    activeSkinTone: string;
    unified: string;
  }

  export interface EmojiPickerProps {
    onEmojiClick?: (emojiData: EmojiClickData, event: MouseEvent) => void;
    width?: number | string;
    height?: number | string;
    theme?: Theme | string;
    emojiStyle?: EmojiStyle | string;
    searchPlaceHolder?: string;
    autoFocus?: boolean;
    skinTonesDisabled?: boolean;
    previewConfig?: Record<string, unknown>;
    lazyLoadEmojis?: boolean;
    searchDisabled?: boolean;
  }

  const EmojiPicker: FC<EmojiPickerProps>;
  export default EmojiPicker;
}
