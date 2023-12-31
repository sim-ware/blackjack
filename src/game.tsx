import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

// 
// UI Elements //
const CardBackImage = () => (
  <img alt="Back of card" src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      alt="Front of card"
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

// 
// Setup //
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been given theirs
    turn: "player_turn",
  };
};

// 
// Scoring //
const calculateHandScore = (hand: Hand): number => {
  let totalScore = 0;
  let aces = 0;

  hand.forEach((card:Card) => {
    const { rank } = card;

    const cardFaceValue = parseInt(rank);
    const cardHasValidFaceValue = !isNaN(cardFaceValue);

    if (cardHasValidFaceValue) totalScore += cardFaceValue;
    if (rank === 'jack')       totalScore += 10;
    if (rank === 'queen')      totalScore += 10;
    if (rank === 'king')       totalScore += 10;
    if (rank === 'ace')        aces++;
  });

  if (totalScore === 10 && aces === 1) return totalScore += 11;
  if (totalScore === 10 && aces > 1)   return totalScore += aces;

  for (let i = 0; i < aces; i++) {
    const currentScore    = totalScore + 11;
    const isGreaterThan21 = currentScore > 21;

    isGreaterThan21 ? totalScore += 1 : totalScore += 11;
  }

  return totalScore;
};

const determineGameResult = (state: GameState): GameResult => {
  const { playerHand, dealerHand } = state;
  const playerScore = calculateHandScore(playerHand);
  const dealerScore = calculateHandScore(dealerHand);

  const playerBust         = playerScore > 21;
  const dealerBust         = dealerScore > 21;
  const playerBlackjack    = playerHand.length === 2 && playerScore === 21;
  const dealerBlackjack    = dealerHand.length === 2 && dealerScore === 21;

  if (playerBust) return "dealer_win";
  if (dealerBust) return "player_win";

  if (playerBlackjack && dealerBlackjack) return "draw";
  if (playerBlackjack) return "player_win";
  if (dealerBlackjack) return "dealer_win";

  if (playerScore > dealerScore) return "player_win";
  if (dealerScore > playerScore) return "dealer_win";

  if (playerScore === dealerScore) return "draw";

  return "no_result";
};

// 
// Player Actions //
const playerStands = (state: GameState): GameState => {
  const { dealerHand } = state
  const score = calculateHandScore(dealerHand);
  const sixteenOrLess = score <= 16;

  if (sixteenOrLess) {
    const { card, remaining } = takeCard(state.cardDeck);
    return {
      ...state,
      dealerHand: [...state.dealerHand, card],
      cardDeck: remaining,
      turn: "dealer_turn",
    };
  }

  return {
    ...state,
    turn: "dealer_turn",
  };
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

// 
// UI Component //
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) !== "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
