const { processPayByLinkGet } = require('./PayByLink');

console.log('Retrieving pay-by-links...');

processPayByLinkGet((error, data, response, status) => {
  if (error) {
    console.error('Error retrieving pay-by-links:', error);
  } else if (status === 0) {
    console.log('Pay-by-links retrieved successfully:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('Failed to retrieve pay-by-links. Status:', status);
    console.log('Response:', response);
  }
});
