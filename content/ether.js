const path = 'wss://mainnet.infura.io/ws/v3/b91c9b9835a847ff97628fc272606412';
const provider = new Web3.providers.WebsocketProvider(path);
provider.on('error', e => console.error('WS Error', e));
provider.on('end', e => console.error('WS End', e));

const web3 = new Web3(provider);

const abi_file_list = ['./abi1.json', './abi2.json'];
const contract_address_list = ['0x06012c8cf97bead5deae237070f9587f8e7a266d', '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB'];

// const abi1_file = './abi1.json';
// const abi1 = await fetch(abi1_file).then(x => x.json());
// console.log('abi1:');Z
// console.log(abi1)
// const contract_address1 = '0x06012c8cf97bead5deae237070f9587f8e7a266d';

// const my_contract1 = new web3.eth.Contract(abi1, contract_address1);

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }


async function get_abi_pre (contract_address) {
    let etherscan_address = 'https://api.etherscan.io/api?module=contract&action=getabi&address=';
    let scrapping_address = etherscan_address.concat(contract_address, '&apikey=YourApiKeyToken');
    var abi = $.getJSON(scrapping_address, (data) => {
        return JSON.parse(JSON.stringify(data.result));
    });
    return abi;
}

async function get_abi (contract_address) {
    let abi = await get_abi_pre(contract_address);
    return abi.result;
}


async function construct (contract_address) {
    let abi_wrap = await get_abi(contract_address);
    let abi = JSON.parse((abi_wrap));
    console.log('abi:')
    console.log(abi);
    let my_contract = new web3.eth.Contract(abi, contract_address);
    return [my_contract, abi];
}


async function list_construct (contract_address_list) {
    let array = [];
    let iter = contract_address_list.length;
    for (let i = 0; i < iter; i++) {
        sleep(5500);
        let [contract, abi] = await construct(contract_address_list[i]);
        let contract_json = {"contract": contract, "abi": abi};
        array.push(contract_json);
    }
    console.log('contract log list:');
    console.log(array);
    return array;
}

async function event_extract(abi){
    let events = JSON.parse(JSON.stringify(abi)).filter((item) => {
        let decision = 'type' in item ? (item.type == 'event') : false;
        console.log(item);
        console.log(decision);
        return decision;
    }).map((item) => {
        return item.name;
    });
    console.log('event_extract:');
    console.log(events);
    return events;
}

async function event_filter(contract, event='All', from=14160000, to= 14164271) {
    var filter = {fromBlock: from, toBlock: to};
    var my_events = await contract.getPastEvents('allEvents', filter, (error, result) => {
        console.log('ERROR:' + error);
    }).then((events) => {
        console.log('bsdfbd');
        return events.filter((x) => {
            if (event == 'All') {
                return true;
            } else {
                return x.event == event;
            }
        });
    });
    console.log('event_filter:');
    console.log(my_events);
    return my_events;
}


function event_sort(event_list, event_numbers) {
    let array = [];
    let iter = event_list.length;
    for (let i = 0; i < iter; i++) {
        let temp = {
            "label": event_list[i],
            "data": event_numbers[i]
        }
        array.push(temp);
    }

    let temp_array = array.sort((a,b) => {
        return b.data.frequency - a.data.frequency;
    });
    let temp_list = temp_array.map((a) => a.label);
    let temp_numbers = temp_array.map((a) => a.data);

    return [temp_list, temp_numbers];
}


function interval_partition(partition=1, from=14160000, to= 14164271){
    let length = Math.floor((to - from) / partition);
    let new_interval = [];
    for(let i = 0; i < partition; i++){
        new_interval.push(from + (i * length));
    }
    console.log('new interval');
    console.log(new_interval);
    return new_interval;
}


function event_partition(specific_events, partition=1, from=14160000, to= 14164271){
    let new_interval = interval_partition(partition, from, to);
    let time_event_occur = [];
    for(let i = 0; i < new_interval.length-1; i++){
        let time_events = specific_events.filter((x) => {
            let judge = (x.blockNumber >= new_interval[i]) && (x.blockNumber < new_interval[i+1]);
            console.log('judge');
            console.log(new_interval[i]);
            console.log(x.blockNumber);
            console.log(new_interval[i+1]);
            console.log(judge);
            return judge
        });
        time_event_occur.push(time_events.length);
    }
    console.log('event partition');
    console.log(time_event_occur);
    return time_event_occur;
}



function event_value(event_occur, partition=10, from=14160000, to= 14164271){
    let sum = 0;
    for(let i = 0; i < event_occur.length; i++){
        let event_now = event_occur[i];
        let result_values = event_now.returnValues;
        if (result_values.hasOwnProperty('value')){
            let value = event_now.returnValues.value;
            console.log('value');
            console.log(value);
            sum += parseInt(value);
        }
    }
    let event_tendency = event_partition(event_occur, partition, from, to);
    let event_data_list = {
        "totalAmount": Math.floor(sum / (10**18)),
        "frequency": event_occur.length,
        "tendency": event_tendency
    };
    return event_data_list;
}

async function event_data(contract,abi){
    let event_list = await event_extract(abi);
    let map = async(event) => {
        let event_occur = await event_filter(contract, event);
        console.log('event_occur:');
        console.log(event_occur);
        return event_value(event_occur);
    };
    let event_data_list = await Promise.map(event_list, map);
    console.log(event_data_list);
    let [event_list1, event_data_list1] = event_sort(event_list, event_data_list);
    console.log('event_data');
    console.log(event_list1);
    console.log(event_data_list1);
    return [event_list1, event_data_list1];
}



async function event_chart(contract, abi, id){
    let [event_list, event_data_list] = await event_data(contract, abi);
    // let tend = event_data_list[0].tendency;
    let tend_list = await Promise.map(
        event_data_list, 
        async(x) => {return x.tendency;}
    );
    let new_label = Array.from(Array(tend_list[0].length), (_, i) => i+1);
    let colorlist = ['rgb(0,0,0)', 'rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)'];
    let tendency_datasets_list = [];
    for (let i = 0; i < 4; i++){
        let temp = {
            label: event_list[i],
            backgroundColor: colorlist[i],
            borderColor: colorlist[i],
            data: tend_list[i],
        };
        tendency_datasets_list.push(temp);
    }

    let data2 = {
                labels: new_label,
                datasets: tendency_datasets_list,
        };
    
    let config2 = {
            type: 'line',
            data: data2,
            options: {}
        };

    let extract_frequency = async(data) => {
        return data.frequency;
    }
    let extract_totalAmount = async(data) => {
        return data.totalAmount;
    }
    console.log('chartdata:');
    let chartdata_frequency = await Promise.map(event_data_list, extract_frequency);
    let chartdata_totalAmount = await Promise.map(event_data_list, extract_totalAmount);
    console.log(event_data_list);
    let data1 = {
            labels: event_list,
            datasets: [{
                label: 'Total Amount of The Event',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: chartdata_totalAmount,
            },{
                label: 'Frequency of The Event',
                backgroundColor: 'rgb(0, 0, 255)',
                borderColor: 'rgb(0, 0, 255)',
                data: chartdata_frequency,
            }]
    };
    let config1 = {
        type: 'bar',
        data: data1,
        options: {}
    };

    let chart_name1 = 'Chart'.concat('', ''+ (id + 1));
    let chart_name2 = 'Chart'.concat('', ''+ (id + 2));
    new Chart(
        document.getElementById(chart_name1),
        config1
    );
    new Chart(
        document.getElementById(chart_name2),
        config2
    );
}

async function event_charts(contract_address_list){
    let array = [];
    let iter = contract_address_list.length;
    let contracts_log = await list_construct(contract_address_list);
    for (let i = 0; i < iter; i++) {
        await event_chart(contracts_log[i].contract, contracts_log[i].abi, (3 * i));
    }
}

event_charts(contract_address_list);


// async function construct (contract_address, abi_file) {
//     let abi = await fetch(abi_file).then(x => x.json());
//     let my_contract = new web3.eth.Contract(abi, contract_address);
//     return [my_contract, abi];
// }

// async function list_construct (contract_address_list, abi_file_list) {
//     let array = [];
//     let iter = contract_address_list.length;
//     for (let i = 0; i < iter; i++) {
//         let [contract, abi] = await construct(contract_address_list[i], abi_file_list[i]);
//         let contract_json = {"contract": contract, "abi": abi};
//         array.push(contract_json);
//     }
//     console.log(array);
//     return array;
// }


// async function event_filter(contract, event='All') {
//     var filter = {fromBlock: 14126000, toBlock: 'latest'};
//     var my_events = await contract.getPastEvents('allEvents', filter, (error, result) => {
//         console.log('ERROR:' + error);
//     }).then((events) => {
//         console.log('bsdfbd');
//         return events.filter((x) => {
//             if (event == 'All') {
//                 return true;
//             } else {
//                 return x.event == event;
//             }
//         });
//     });
//     console.log('my contract log:');
//     console.log(my_events);
//     return my_events;
// }

// async function event_scrapping(abi){
//     let events = JSON.parse(JSON.stringify(abi)).filter((item) => {
//         let decision = 'type' in item ? (item.type == 'event') : false;
//         console.log(item);
//         console.log(decision);
//         return decision;
//     }).map((item) => {
//         return item.name;
//     });
//     console.log(events);
//     return events;
// }

// async function event_data(contract,abi){
//     let event_list = await event_scrapping(abi);
//     let map = async(event) => {
//         let event_occur = await event_filter(contract, event);
//         console.log('event_occur:');
//         console.log(event_occur);
//         return event_occur.length;
//     };
//     // let map_then = (event) => map(event).then((result)=>{return result;});
//     let event_numbers = await Promise.map(event_list, map);
//     console.log(event_numbers);
//     return [event_list, event_numbers];
// }


// async function event_chart(contract, abi, id){
//     let [event_list, event_numbers] = await event_data(contract, abi);
//     let data = {
//             labels: event_list,
//             datasets: [{
//             label: 'My First dataset',
//             backgroundColor: 'rgb(255, 99, 132)',
//             borderColor: 'rgb(255, 99, 132)',
//             data: event_numbers,
//             }]
//     };
//     let config = {
//         type: 'bar',
//         data: data,
//         options: {}
//     };
//     console.log('id:');
//     console.log(id);
//     let chart_name = 'Chart'.concat('', ''+ (id + 1));
//     console.log(chart_name);
//     new Chart(
//         document.getElementById(chart_name),
//         config
//     );
// }

// async function event_charts(contract_address_list, abi_file_list){
//     let array = [];
//     let iter = contract_address_list.length;
//     let contracts_log = await list_construct(contract_address_list, abi_file_list);
//     for (let i = 0; i < iter; i++) {
//         await event_chart(contracts_log[i].contract, contracts_log[i].abi, i);
//     }
// }

// event_charts(contract_address_list, abi_file_list);