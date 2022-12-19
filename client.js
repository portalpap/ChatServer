const net = require('net');
process.stdin.setEncoding('utf-8');



const client = net.createConnection({port: 3000}, () => {
    console.log('connected');
    
    process.stdin.on('readable', () =>{
        let ans;
        while((ans = process.stdin.read()) != null){   
            ans = ans.trim();
            if(ans == 'e' || ans == 'exit') {
                process.stdout.write(`EXIT\n`);
                client.end();
                break; 
            }
            client.write(ans);
        }
    });
});

client.setEncoding('utf-8');

client.on('data', data => {
    console.log( data);
});

client.on('error', () => {

})