import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
import logging
import random
import time
import json
import sys
import pprint
import math


shape_file = 'DataShapes.json'
ddb_local = False
ddb_region = 'us-west-1'


if len(sys.argv) > 1:
    shape_file = sys.argv[1]

my_config = Config(
    region_name=ddb_region,
    connect_timeout=25, read_timeout=25,
    retries={'total_max_attempts': 3, 'mode': 'standard'}
)

class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


target_table = ''

dataSettings = {
    "status_every": 100
}

pp = pprint.PrettyPrinter(indent=4)

log_string_format=None

# log_string_format = "%(asctime)s %(name)s:%(lineno)d [%(levelname)s]  %(message)s"

# boto3.set_stream_logger("boto3.resources", logging.DEBUG)
# boto3.set_stream_logger("botocore.httpsession", logging.DEBUG, format_string=log_string_format)
# boto3.set_stream_logger("botocore", logging.DEBUG, format_string=log_string_format)


if log_string_format is None:
    log_string_format = "%(asctime)s %(name)s [%(levelname)s] %(message)s"

logger = logging.getLogger('botocore.retries')
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)

formatter = logging.Formatter(log_string_format)
handler.setFormatter(formatter)

# logger.addHandler(handler)


# loggers_dict = logging.Logger.manager.loggerDict
# pp.pprint(loggers_dict)
# exit(1)


if len(sys.argv) > 1:
    target_table = sys.argv[1]

file = open(shape_file, "r")
file_content = file.read()
data_shapes = json.loads(file_content)['shapes']

cities = ['Boston', 'New York', 'New York', 'New York', 'New York', 'Philadelphia', 'Washington D.C.', 'Washington D.C.', None, None, None, None]
statuses = ['QUOTED', 'ORDERED', 'PICKED', 'PACKED', 'SHIPPED', 'DELIVERED', 'RETURNED', None, None, None]
products = ['Car', 'Car', 'Car', 'Truck', 'Truck', 'Bike']
premiums = ['Bronze', 'Bronze', 'Bronze', 'Silver', 'Silver', 'Gold', None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None]
dates = [-150, -80, -60, -20, -10, 2, 1, 0, 0, 2, 10, 20, 60, 80, 150]

def random_string(length=8):
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for i in range(length))


def payload_data(kbs):
    one_kb = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec lacus magna, consectetur vitae faucibus cursus, volutpat sit amet neque. Etiam eu dolor tempor, porttitor risus at, tristique justo. Mauris sollicitudin gravidae diam vitae auctor. Donec velit nunc, semper at varius vel, ornare ac leo. Mauris ac porta arcu. Nam ullamcorper ac ligula ut lobortis. Quisque in molestie velit, ac rutrum arcu. Mauris em lacus, malesuada id mattis a, hendrerit et nunc. Ut pretium congue nisl molestie ornare. Etiam eget leo finibus, eleifend velit sit amet, condimentum ipsum. Aliquam qui nisi quis orci maximus laoreet id vel mi. Phasellus suscipit, leo sed ullamcorper cursus, est nisi fermentum magna, vitae placerat dui nibh eu ipsum. Phasellus faucibus a ex et tempus. Nulla consequat ornare dui sagittis dictum. Curabitur scelerisque malesuada turpis ac auctor. Suspendisse sit amet sapien ac eros viverra tempor.  Draco Dormiens Nunquam Titillandus! Nulam convallis velit ornare ante viverra eget in. Etiam eget leo finibus."
    if isinstance(kbs, int):
        return one_kb * kbs
    else:
        parts = math.modf(kbs)
        return (one_kb * int(parts[1])) + one_kb[:int(parts[0] * 1024)]
        return one_kb * int(kbs)


def main(dynamodb=None):

    if not dynamodb:
        if ddb_local:
            dynamodb = boto3.client('dynamodb', config=my_config, endpoint_url='http://localhost:8000')
        else:
            dynamodb = boto3.client('dynamodb', config=my_config)

    for table in data_shapes:
        if table['table_name'] == target_table or target_table == '':
            load_table(table, dynamodb)


def table_capacity(table_name, dynamodb):
    table_desc = dynamodb.describe_table(TableName=table_name)
    cap = {}
    if 'GlobalSecondaryIndexes' in table_desc['Table']:
        cap['GSI_count'] = len(table_desc['Table']['GlobalSecondaryIndexes'])
    if 'BillingModeSummary' in table_desc['Table']:
        cap['BillingMode'] = table_desc['Table']['BillingModeSummary']['BillingMode']
    else:
        cap['BillingMode'] = 'PROVISIONED'
        cap['WriteCapacityUnits'] = table_desc['Table']['ProvisionedThroughput']['WriteCapacityUnits']

    pktype = ''
    sktype = ''

    cap['KeySchema'] = table_desc['Table']['KeySchema']
    ads = table_desc['Table']['AttributeDefinitions']
    for ad in ads:
        if ad['AttributeName'] == cap['KeySchema'][0]['AttributeName']:
            pktype = ad['AttributeType']
        if ad['AttributeName'] == cap['KeySchema'][1]['AttributeName']:
            sktype = ad['AttributeType']

    cap['KeySchema'][0]['Type'] = pktype
    cap['KeySchema'][1]['Type'] = sktype

    return cap


def load_table(table, dynamodb):
    record_count = 0
    # dynamodb = boto3.client('dynamodb', config=my_config)
    # session = botocore.session.get_session()
    retries_total = 0
    ptee_total = 0
    wcu_total = 0
    wcu_this_second = 0
    items_this_second = 0

    cap = table_capacity(table['table_name'], dynamodb)
    ks = cap['KeySchema']

    # print(ks[0]['Type'])
    # print(ks[1]['Type'])

    gsi_summary = ''
    if 'GSI_count' in cap:
        gsi_summary = f', GSIs: {cap["GSI_count"]}'

    print(f'\nLoading table       : {bcolors.OKCYAN}{table["table_name"]} ({cap["BillingMode"]}{gsi_summary}){bcolors.ENDC}')
    # print(cap)

    if 'WriteCapacityUnits' in cap:
        wcu_max_rate = cap["WriteCapacityUnits"]
        print(f'wcu/sec provisioned : {bcolors.OKCYAN}{wcu_max_rate}{bcolors.ENDC}')
        print()

    start_time = time.time()
    item_start_second = round(start_time)

    item_duration = 0

    durations = []
    collection_size_adjustments = [-3, -2, -1, 0, 0, 0, 1, 2, 3]
    ipp = 0

    for p in range(1, table['partition_count'] + 1):
        randos = [random.randint(1, 1000000) for i in range(0, table['items_per_partition'] + 3)]
        collection_index = 0
        ipp = random.choice(collection_size_adjustments)

        for s in range(1, table['items_per_partition'] + 1):   # + ipp


            record_count += 1
            rcc = 0
            pkval = {}
            skval = {}
            if ks[0]['Type'] == 'S':
                pkval[ks[0]['Type']] = table['pk_prefix'] + str(p).zfill(4)
            else:
                pkval[ks[0]['Type']] = str(p)

            if ks[1]['Type'] == 'S':
                skval[ks[1]['Type']] = table['sk_prefix'] + str(s).zfill(4)
            else:
                skval[ks[1]['Type']] = str(s)


            request = {
                'TableName': table["table_name"],
                'Item': {
                    'PK': pkval,
                    'SK': skval,
                    'balance': {'N': str(randos[collection_index])},
                    'rating': {'N': str(round(randos[collection_index]/3333, 2))},
                    'payload': {'S': payload_data(table['payload_size'])}
                },
                'ReturnConsumedCapacity': 'TOTAL'
            }

            my_date = datetime.now()

            end_date = my_date + timedelta(days=random.choice(dates))

            request['Item']['date'] = {'S': end_date.isoformat()[:19]}

            product = random.choice(products)
            if product:
                request['Item']['product'] = {'S': product}

            status = random.choice(statuses)
            if status:
                request['Item']['status'] = {'S': status}

            premium = random.choice(premiums)
            if premium:
                request['Item']['premium'] = {'S': premium}

            city = random.choice(cities)
            if city:
                request['Item']['city'] = {'S': city}

            collection_index += 1
            previous_start_second = item_start_second
            items_this_second += 1
            item_start_time = time.time()
            item_start_second = round(item_start_time)
            if item_start_second > previous_start_second:
                current_wcu_per_req = round(wcu_this_second / items_this_second, 2)

                print('summary for second: ', previous_start_second, ' wcu used: ', wcu_this_second, ' items: ', items_this_second)
                wcu_this_second = 0
                items_this_second = 0
            # print(item_start_second)

            try:
                # if record_count % dataSettings['status_every'] == 0:
                #     print(f'{record_count} put item: {request["Item"]["PK"]["S"]} {request["Item"]["SK"]["S"]}')

                response = dynamodb.put_item(**request)

                ra = response['ResponseMetadata']['RetryAttempts']
                if ra > 0:
                    print(bcolors.OKGREEN,'  * retries: ', ra, bcolors.ENDC)
                retries_total += ra

                rcc = response['ConsumedCapacity']['CapacityUnits']
                wcu_total += rcc
                wcu_this_second += rcc
                # print(response['ResponseMetadata']['HTTPStatusCode'])

            except ClientError as ce:
                error_code = ce.response['Error']['Code']
                if error_code == 'ProvisionedThroughputExceededException':
                    ptee_total += 1
                print(bcolors.HEADER, ce.response['ResponseMetadata']['HTTPStatusCode'], error_code, bcolors.ENDC)
                print(bcolors.WARNING, ce, bcolors.ENDC)

            except BaseException as error:
                print("Unknown error while putting item: " + error.response['Error']['Message'])

            finally:
                item_end_time = time.time()
                item_duration = round(item_end_time - item_start_time, 5)
                durations.append(item_duration)

                # if item_start_second == previous_start_second:
                #     wcu_this_second += rcc
                # else:
                #     wcu_this_second = rcc

                # print(f'                      wcu consumed: {rcc} pss: {previous_start_second} iss: {item_start_second} wts: {round(wcu_this_second)}')

                # if wcu_this_second > wcu_max_rate:
                #     print(' *** sleep time: ', item_end_time % 1)
                    # time.sleep(1.0)

    end_time = time.time()
    duration = round(end_time - start_time, 2)
    if duration < 1:
        duration = 1
    wcu_second = round(wcu_total / duration, 1)
    latency_average = round(1000 * (sum(durations) / len(durations)))
    latency_max = round(1000 * max(durations))
    items_second = round(1000/latency_average)
    print()
    print(f'processed           : {bcolors.OKCYAN}{record_count}{bcolors.ENDC}')
    print(f'retries             : {bcolors.OKGREEN}{retries_total}{bcolors.ENDC}')
    print(f'failed              : {bcolors.HEADER}{ptee_total}{bcolors.ENDC}')
    print()
    print(f'avg latency (ms)    : {latency_average}')
    print(f'max latency (ms)    : {latency_max}')
    print()
    print(f'items/second        : {items_second}')
    print(f'total duration      : {duration}')
    print(f'wcus_total          : {round(wcu_total)}')
    print(f'wcu/sec consumed    : {wcu_second}')
    if "WriteCapacityUnits" in cap:
        print(f'wcu/sec provisioned : {cap["WriteCapacityUnits"]}')


def token_bucket(bucket):

    return 'hello'


if __name__ == "__main__":
    main()
