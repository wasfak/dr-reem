export type NoteStatus = "unpaid" | "partial" | "paid";

export interface FeedNote {
  kind: "note";
  id: string;
  text: string;
  userName: string;
  createdAt: string;
  amount: number;
  amountPaid: number;
  status: NoteStatus;
}

export interface FeedEvent {
  kind: "event";
  id: string;
  text: string;
  userName: string;
  createdAt: string;
}

export type FeedItem = FeedNote | FeedEvent;

export interface Company {
  _id: string;
  name: string;
  notes?: string;
}
