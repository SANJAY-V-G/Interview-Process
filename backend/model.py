import json
import imageapi

def read_from_uid(filename="models/uid.json"):
    with open(filename, "r") as file:
        data = json.load(file)  # Load JSON data
    return int(data['uid'])

def write_from_uid(num,filename="models/uid.json"):
    with open(filename, "w") as file:
        data = {'uid': num}
        json.dump(data, file)

def write_to_json(data, filename="models/databaseModel.json"):
    datamodel=read_from_json()
    datamodel[read_from_uid()]=data
    write_from_uid(read_from_uid()+1)
    with open(filename, "w") as file:
        json.dump(datamodel, file) 
    

def read_from_json(filename="models/databaseModel.json"):
    with open(filename, "r") as file:
        data = json.load(file)
        return data


def update_json(uid, data, filename="models/databaseModel.json"):
    with open(filename, "r") as file:
        datamodel = json.load(file)
    
    # Update the specific entry in the dictionary
    datamodel[str(uid)] = data 
    with open(filename, "w") as file:
        json.dump(datamodel, file)
def write_new_json(data, filename="models/databaseModel.json"):
    with open(filename, "w") as file:
        json.dump(data, file)


def read_image_company(company_name, filename="models/image.json"):
    with open(filename, "r") as file:
        datamodel = json.load(file)
    if company_name in datamodel:
        return datamodel[company_name]
    else:
        print(1)
        datamodel[company_name] = {"imageurl":imageapi.fetch_company_image(company_name), "logourl":imageapi.fetch_company_logo(company_name)}
        with open(filename, "w") as file:
            json.dump(datamodel, file)
        return datamodel[company_name]

def write_image_company(company_name, filename="models/image.json"):
    print(1)
    with open(filename, "r") as file:
        datamodel = json.load(file)
    datamodel[company_name] = {"imageurl":imageapi.fetch_company_image(company_name), "logourl":imageapi.fetch_company_logo(company_name)}
    with open(filename, "w") as file:
        json.dump(datamodel, file)
