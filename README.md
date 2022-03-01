# NFT Analyzer

## Introduction
This is the github repository of [NFT](https://en.wikipedia.org/wiki/Non-fungible_token) Analyzer based on Javascript and [Hugo Framework](https://gohugo.io/). 
The goal of this project is to provide visible and clear events data analysis for [cryptopunk](https://www.larvalabs.com/cryptopunks) and [cryptokitties](https://www.cryptokitties.co/) without any checking and scrapping from [etherscan](https://etherscan.io/), as eventually to faciliate others who know nothing about smart contract mechanism and implementation. 

## Original Intention
Thanks to the wonderful [introduction](https://medium.com/@stephanie.werli/exploring-ethereum-blockchain-events-data-scraping-aa252c3122e8) from Stephanie Werli, the authur, instead of utilizing python packages to manually process the data through scrapping, wanted to establish a website to automatically analyze the event data from some specific NFT market recorded on the blockchain.

## Usage
In order to view the data ananlysis of two famous NFT markets, please open the website directly[https://zibo-yang.github.io/tester/](https://zibo-yang.github.io/tester/).

In order to re-implement this repository locally, please install [hugo extended](https://gohugo.io/getting-started/installing/) first and run the command below after every update:

```bash
hugo server -D
```

## Drawbacks
Although the basic frame of this NFT Analyzer has been erected, there are plenty of things inconvenient and incomplete to further our implementation:

* Lack of correlation matrix chart: As everyone could see with the chart of [cryptokitties](https://zibo-yang.github.io/tester/post/chapter-1/)
[![overlap.png](https://i.postimg.cc/2yg8hjsD/overlap.png)](https://postimg.cc/SY7hp4QT)
it's obvious that the green and blue curves are overlapped, which means their correlation should be 1. Since the correlation matrix could theoretically display the dependence of two specific event and probably minimize our further events analysis. The authur doens't make it since the hugo framework we are currently using here share a complex integration mechanism with python packages or node.js, which hinders us to manage to implement the correlation chart before deadline.

* Lack of elaboration of two charts: the wordings to explain the meaning of this two charts are still incomplete.

* Lack of correction for: there is still an error at the bottom of two subpages as well:
```
This domain is not registered with Commento.
```
