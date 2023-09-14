# BlackJack

#### Installation
1. Install required packages: `yarn` (or npm)
2. Run the local dev server with `yarn start`
3. Run the test suit with `yarn test`

#### Aim
* Fix the tests to make the game work!

#### Rules
* This is a simplified version of BlackJack so there are only two players the 'player' and the 'dealer'. There is also no gambling!
* The game is played with a deck of 52 cards
* At the start of the game the deck is shuffled and two cards are dealt to the player and the dealer
* Play begins with the player. The following choices available to the player:
    * "Stand": Player stays put with their cards.
    * "Hit": Player draws another card. If this card causes the player's total points to exceed 21 ("bust") then they will lose.
* After the player has had their turn, the dealer will turn over their first card.
* If the dealer has a score of 16 or less then the dealer must take another card

#### Result
* If the player or the dealer goes over 21 then they will 'bust' and lose.
* If no player has bust then the player with the higher point total will win.
* If both players have the same score the result is a draw unless one player has blackjack in which case they win.

#### Scoring
* Aces may be counted as 1 or 11 points. The higher value applies if it does not cause the player to go over 21
* Cards 2 to 9 are same as face value (e.g 5 = 5 points)
* Ten, Jack, Queen and King cards count as ten points.
* The value of a hand is the sum of the point values of the individual cards. Except, a "blackjack" is the highest hand, consisting of one ace and any 10-point card, and it outranks all other 21-point hands.

#### Approach
I decided to fix the tests in order, beginning with the `Calculating the score` section.

For the first test: __'the score for a hand with 8, 10 is 18'__ I honed in on the `calculateHandScore` fN. I initially mapped the `hand` fN argument to create an array of only the `rank` values. As this test only factored into account numerical string values, I used `parseInt()` to convert the values within the array to `numbers`, and then totalled them using `[].reduce((a, b) => a + b)`. This passed the test, and felt like a good start, but naturally excluded a lot of the impending complexity.

For the second test: __'the score for a hand with Ace, 10 is 21'__, the previous code only accounted for string numbers, and not for picture cards, in this case, aces. After calling `parseInt()` on the `rank` being calculated, I then called `!isNaN()` on the returned result to return `true` for face cards, and `false` for the rest. As we were looking specifically at aces within this test, and the input test data for this test included a blackjack, I simply converted aces to 11 to pass the tests for this moment as so: `if (rank === 'ace') totalScore += 11`.

For the third test: __'the score for a hand with Ace, 5, Ace, Ace is 18'__, we're now looking at a situation where both possible values for an ace, 1 & 11, are being used within the same hand. This invalidated my previous code, and required a tweak of the logic. As mentioned in the scoring section above, for aces, 'the higher value applies if it does not cause the player to go bust'. So whenever totalling the score and adding an ace to its value, I had to create a variable called `currentScore` - this is a sort of holding value for the score while we add each ace's value onto it. If adding an ace as an 11 caused the `currentScore` to rise above 21, I'd instead add the ace's value as a 1 instead. The logic here can be summarised as: `currentScore > 21 ? totalScore += 1 : totalScore += 11;`

For the fourth test: __'the score for a hand with Ace, 10, Ace is 12'__, although unlikely that a player would choose to hit for an extra card when they have an Ace and a card with a value of 10, this test case exposes another quirk with calculating aces. This test case kind of breaks the above, as the previous code would take the first ace, convert it to 11 (as it doesn't cause us to bust), then add the 10, giving us 21. At this stage, adding another ace causes the `currentScore` to rise above 21, and so we convert the final ace to a 1 instead of 11 - still giving us a bust `totalScore` of 22. Given the set of cards in the hand, we don't necessarily need to go bust here, as both aces hypothetically could be converted to 1's, which would give us the result the test expects. After an espresso and a small walk, I distilled the potential outcomes with aces into three possibilites:
 * if you have a `totalScore` of 10, and a single ace - always convert the ace to 11
 * if you have a `totalScore` of 10, and multiple aces - always convert the aces to 1
 * for any other case, use the same logic created for the previous test, tallying as above

The next group of tests belong to `The Player Actions` section.

For the first broken test: __'When the player 'stands' and the dealer has a score of 16 or less then the dealer must take a card'__ I focussed on the `playerStands` fN. As it stood, the function would change the turn to the dealer's turn, whilst preserving the rest of the game state. To pass this test, we needed to add a card to the dealer's hand, and also update the remaining cards. This is done through use of the `takeCard` fN, which returns a new card, and also the updated deck: `const { card, remaining } = takeCard(state.cardDeck);`. All that was left to do to pass the test was to update the game state with these new variables, adding `card` to the dealer's hand: `dealerHand: [...state.dealerHand, card]` and also updating the rest of the deck with the remaining cards: `cardDeck: remaining`.

However, this then broke the final test in this section: __'When the player 'Stands' and the dealer has a score of 17 or more then the dealer must not take another card'__. So, depending on the dealer's score, we need to either take a card as above, and update the remaining deck, or preserve the rest of the game state while updating it only to reflect the fact that it's the dealer's turn. I created a variable: `const sixteenOrLess = score <= 16;`. This would return `true` if the score was sixteen or less, in which case we would cause the dealer to take a card and update the rest of the deck. If 17 or more, we would change to the dealer's turn and preserve the rest of the game state.

The final group of tests belong to the `Determining the Winner` section.

Before comparing the player and dealer's scores, there are two kind of game-ending conditions - a best possible hand of Blackjack, which is quite rare and results in an instant victory for the player who owns it, unless both players do. And a bust hand where the score exceeds 21, which results in a loss for that player.

I completed these tests in order, but had to think about the order in which we look for bust hands and blackjacks before comparing scores and returning the result. I began with looking for bust hands as these felt like an immediate loss to the player who owns them.

If neither player has gone bust, we need to consider the various possibilites of blackjack hand combinations between players before calculating and comparing scores in a more traditional way. In the same way that a bust hand leads to an instant loss, a blackjack hand would lead to an instant win (unless both players have them, in which case it's a draw). I calculated for blackjack hands after bust hands as the likelihood of a blackjack hand felt rarer than a bust hand.

I then left the more straightforward score calculations and comparisons to the end of the fN. Having considered the hand possibilities that more or less instantly end the game, and if those possibilites were not to occur in the game, then a more straightforward approach of comparing the scores and declaring the one with the highest the winner resulted. Unless the scores were equal, which would result in a draw.