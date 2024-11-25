# Home Buyer Index data

Note that the [Home Buyer Index](https://www.nbcnews.com/data-graphics/us-home-buyer-index-data-cost-availability-difficulty-rcna139257) data covers more than 1,200 counties, where approximately 85% of the U.S. population live. Counties that don't have enough real estate transactions to make a meaningful assessment of market conditions are excluded.

## 2024-election-vote-shift-vs-index.csv

This is the data behind the analysis comparing [how much the vote margin in certain counties in the 2024 presidential election shifted, compared to 2020](https://www.nbcnews.com/data-graphics/housing-market-trump-win-2024-election-rcna179153). Election result data is as of mid November.

### Data dictionary

* geo_id: FIPS code
* hbi: The [Home Buyer Index](https://www.nbcnews.com/data-graphics/us-home-buyer-index-data-cost-availability-difficulty-rcna139257) average for that county from January 2024 to September 2024.
* margin-pct-pt-chg: The percentage point change in the vote margin from 2020 to 2024. Positive values are a shift toward Trump, negative values a shift toward Harris. Example: If Biden received 55% of the vote and Trump 43% in 2020, the margin was -12 percentage points. Further, if in 2024, Harris received 52% of the vote and Trump 47%, that margin was -5 percentage points, a shift toward Trump of 7 percentage points.
* shift-direction: Did the vote shift toward the Republicans (shift R) or the Democrats (shift D)
