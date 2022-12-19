const fs = require('fs');

// console.log(fs.readFile('./lib',));
fs.readdir('./lib', (err, data) => {
    if (err) throw err;

    for(let iter of data){
        console.log(iter);
    }
  });