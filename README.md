# eosio-airdropper
A simple node.js script for executing bulk transactions on any EOSIO Blockchain one by one

**quickstart**

1. npm install
2. add a .env file with PVK as your private active key of your account
3. If you already have a list of accounts, add the accounts and amount in curPayoutList in data.js
4. If you are using a complicated NFT holding system then go through the atomic assets functions in payouts.js (This script was specifically for a project, so you may need to go through some changes).
5. node payouts.js
