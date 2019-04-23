# FEC 2019 Quarter 1 crossover donors

These scripts use 2019 Q1 filings from the FEC to determine which candidates gave to multiple candidates (committees in FEC-speak). It should generate two `.csv` files in `outputs`:

1. `donors-to-multiple-committees.csv` which is every donor who gave to multiple committees and the amounts per committee
1. `donors-to-multiple-committees-grid.csv` which is a matrix of how many donors each campaign shares with the other campaigns