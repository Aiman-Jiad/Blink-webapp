declare module 'emoji-picker-react' {
  import type { FC } from 'react';

  export enum EmojiStyle {
    NATIVE = 'native',
    APPLE = 'apple',
    GOOGLE = 'google',
    TWITTER = 'twitter',
    FACEBOOK = 'facebook',
  }

  export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
    AUTO = 'auto',
  }

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
