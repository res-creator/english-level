export interface DialogueLine {
  id: string;
  /** Who said it. `you` renders on the right, in violet. */
  from: "them" | "you";
  /** English is always set in the serif; Russian never appears here. */
  text: string;
  /** A turn you haven't completed yet — shown as a pending gap. */
  pending?: boolean;
}
