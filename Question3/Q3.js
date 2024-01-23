const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const dataUrl = 'https://api.dapplooker.com/chart/87596cde-e5df-4a5d-9e72-7592d4861513?api_key=4721550ec26a47cabbf1aa0609ab7de3&output_format=json';

// Helper function to filter fields for recent transactions
const filterRecentTransactions = (transactions) => {
  return transactions.map((transaction) => {
    return {
      blockHash: transaction.blockHash,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
    };
  });
};

app.get('/api/tables', async (req, res) => {
  try {
    const response = await axios.get(dataUrl);
    const tables = response.data.__schema.types.filter((type) => {
      const entityDefinition = type.entityDefinition;
      return (
        entityDefinition.fields !== null &&
        entityDefinition.fields !== '' &&
        entityDefinition.fields !== undefined &&
        entityDefinition.fields.length > 0 &&
        !['block', 'transaction'].includes(entityDefinition.name.toLowerCase()) &&
        !entityDefinition.name.startsWith('_')
      );
    });
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/averageGasPrice', async (req, res) => {
  try {
    const response = await axios.get(dataUrl);
    const transactions = response.data.transaction;
    
    // Calculate average gas price of the day
    const totalGasPrice = transactions.reduce((sum, transaction) => sum + transaction.gasPrice, 0);
    const averageGasPrice = totalGasPrice / transactions.length;

    res.json({ averageGasPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/transactionsPerBlock', async (req, res) => {
  try {
    const response = await axios.get(dataUrl);
    const blocks = response.data.block;

    // Get number of transactions per block
    const transactionsPerBlock = blocks.map((block) => ({
      blockNumber: block.number,
      transactionsCount: block.transactions.length,
    }));

    res.json(transactionsPerBlock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/transformStructure', async (req, res) => {
  try {
    const response = await axios.get(dataUrl);
    const transactions = response.data.transaction;

    // Transform structure: remove specified fields and return recent 10 transactions
    const recentTransactions = filterRecentTransactions(transactions.slice(0, 10));

    res.json(recentTransactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/blockDetails', async (req, res) => {
  try {
    const response = await axios.get(dataUrl);
    const blocks = response.data.block;

    // Get block details: Timestamp, Average gas price, Number of transactions
    const blockDetails = blocks.map((block) => ({
      timestamp: block.timestamp,
      averageGasPrice: block.transactions.reduce((sum, transaction) => sum + transaction.gasPrice, 0) / block.transactions.length,
      transactionsCount: block.transactions.length,
    }));

    res.json(blockDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/blockDetails/:blockNumber', async (req, res) => {
  try {
    const response = await axios.get(dataUrl);
    const blocks = response.data.block;

    // Get timestamp and number of transactions by block number
    const blockNumber = parseInt(req.params.blockNumber);
    const block = blocks.find((b) => b.number === blockNumber);

    if (!block) {
      res.status(404).json({ error: 'Block not found' });
      return;
    }

    res.json({
      timestamp: block.timestamp,
      transactionsCount: block.transactions.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
