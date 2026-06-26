export interface Card {
  id: string;
  text: string;
  symbol: string;
}

export interface Deck {
  id: string;
  question: string;
  cards: Card[];
}
