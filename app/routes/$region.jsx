import {
    useLoaderData,
} from "remix";

import * as fs from 'fs';

import {TableGrid} from "../components/TableGrid";

import {handler} from '~/lambda/src';

import { Menu } from "~/components/menu";

export const action = async ({ request }) => {
    return null;
};

export const loader = async ({ params, request }) => {
    let requestBody = {
        'Region': params.region,
        'ActionName': 'pricing'
    };
    const prices = await handler(requestBody);

    let tables;

    if(params.region === 'demo') {
        const dirContents = fs.readdirSync('./app/demos');

        const indexStats = dirContents.indexOf('stats');
        if (indexStats !== -1) {
            dirContents.splice(indexStats, 1);
        }

        tables = {TableNames:dirContents.map((item) => {

            return item.replace('.json','');
        })};

    } else {
        requestBody = {
            'Region': params.region,
            'ActionName': 'list'
        };
        tables = await handler(requestBody);
    }

    let tableMetadatas = [];

    if(tables?.TableNames) {
        for(table of tables.TableNames) {

            if(params.region === 'demo') {
                const fileContents = fs.readFileSync(
                    './app/demos/' + table + '.json',
                    {encoding: 'utf-8'},
                );
                tableMetadatas.push(JSON.parse(fileContents).Table);

            } else {
                const requestBody = {
                    'Region': params.region,
                    'ActionName': 'describe',
                    'TableName': table
                };
                const metadata = await handler(requestBody);
                tableMetadatas.push(metadata?.Table);
            }

        }
    }

    // console.log('Prices in region ' + params.region);

    // let plKeys = Object.keys(prices.PriceList).sort();

    // plKeys.map((key, index) => {
    //    console.log((index + ' ' + key + '                ').slice(0,31) + ' ' + prices.PriceList[key] );
    // });

    return {
        region:params.region,
        tables:tableMetadatas,
        prices: prices.PriceList
    };
};

export default function RegionIndex() {
    const data = useLoaderData();

    return (
        <div >
            <Menu region={data.region} />


            <TableGrid metadatas={data.tables} />


        </div>
    );
}

