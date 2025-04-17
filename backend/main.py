from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from firebase_config import initialize_firebase
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import firebase_admin
from firebase_admin import firestore

app = FastAPI()

# Initialize Firestore
db = initialize_firebase()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class EducationRequirements(BaseModel):
    cgpa: Optional[str] = "N/A"
    twelfthMark: Optional[str] = "N/A"
    tenthMark: Optional[str] = "N/A"

class Question(BaseModel):
    type: str
    count: str
    # icon: str

class InterviewRound(BaseModel):
    # id: str
    title: str
    duration: str
    questions: List[Question]

class Resource(BaseModel):
    id:  Optional[str] = "N/A"
    title: str
    description: str
    # icon: str
    link: str

class Role(BaseModel):
    id: Optional[str] = ""
    title: str
    description: str
    salaryRange: str
    pdfFile: Optional[str] = None
    pdfFileName: Optional[str] = None
    educationRequirements: EducationRequirements
    technicalSkills: List[str]
    eligibleDepartments: List[str]
    interviewRounds: List[InterviewRound]
    resources: List[Resource]
    contactEmail: str

class Company(BaseModel):
    name: str
    description: str
    type: str
    class Config:
        underscore_attrs_are_private = False 
class SubmitDataRequest(BaseModel):
    company: Company
    roles: List[Role]

class CheckCompanyRequest(BaseModel):
    companyName: str
    namesToCheck: Optional[List[str]] = None

class UpdateJobRequest(BaseModel):
    data: Dict[str, Any]

class UpdateTempAdminRequest(BaseModel):
    username: str
    isTempAdmin: bool

def clean_none(data):
    if isinstance(data, dict):
        return {k: clean_none(v) for k, v in data.items() if v is not None}
    elif isinstance(data, list):
        return [clean_none(item) for item in data]
    return data

# API Endpoints
@app.post("/submit-data")
async def submit_data(data: SubmitDataRequest):
    # print(data)
    try:
        data_dict = data.dict()
        doc_id = str(uuid.uuid4())
        cleaned_roles = clean_none(data_dict["roles"])
        company_ref = db.collection("companies").document(doc_id)
        company_ref.set({
            "company": data_dict["company"],
            "roles": cleaned_roles,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        })

        return {"message": "Data received successfully", "uid": doc_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/check-company")
async def check_company(request: CheckCompanyRequest):
    try:
        input_name = request.companyName.strip().lower()
        names_to_check = request.namesToCheck or [input_name]
        
        companies_ref = db.collection("companies")
        docs = companies_ref.stream()
        
        for doc in docs:
            company_data = doc.to_dict()
            existing_name = company_data["company"]["name"].strip().lower()
            
            for name in names_to_check:
                if existing_name == name:
                    return {"exists": True, "message": "Company already exists"}
                if f"({name})" in existing_name:
                    return {"exists": True, "message": f"Company with '{name}' already exists"}
                if f"({existing_name})" in name:
                    return {"exists": True, "message": f"Company with '{existing_name}' already exists"}
        
        return {"exists": False}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/get-data")
async def get_data():

    try:
        companies_ref = db.collection("companies")
        docs = companies_ref.stream()

        
        ListofData = []
        for doc in docs:
            data = doc.to_dict()
            j = {}
            j['uid'] = doc.id
            j['companyName'] = data['company']['name']
            roless = []
            for k in data['roles']:
                roless.append({"roles": k["title"], "salary": k["salaryRange"]})
            j['description'] = data['company']['description'][:100] + '...'
            j['companyType'] = data['company']['type']
            
            for k in roless:
                cp = j.copy()
                cp.update(k)
                ListofData.append(cp)
                
        return {"data": ListofData}
    except Exception as e:
    
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-job/{uid}")
async def get_data_by_uid(uid: str = Path(..., title="The ID of the company")):
    try:
        doc_ref = db.collection("companies").document(uid)
        doc = doc_ref.get()
        
        if doc.exists:
            return {"data": doc.to_dict()}
        else:
            raise HTTPException(status_code=404, detail="Data not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@app.put("/update-job/{uid}")
async def update_data(uid: str, data: UpdateJobRequest):
    try:
        doc_ref = db.collection("companies").document(uid)

        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Company not found")

        cleaned_data = clean_none(data.data)

        doc_ref.update({
            **cleaned_data,
            "updated_at": firestore.SERVER_TIMESTAMP
        })

        return {"message": "Data updated successfully", "uid": uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))




@app.post("/update-company")
async def update_company(data: Dict[str, Any]):
    try:
        if 'uid' not in data:
            raise HTTPException(status_code=400, detail="UID is required")

        doc_ref = db.collection("companies").document(data['uid'])

        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Company not found")

        update_data = {
            "company": data.get('company'),
            "updated_at": firestore.SERVER_TIMESTAMP
        }

        if 'roles' in data:
            cleaned_roles = clean_none(data['roles'])
            update_data['roles'] = cleaned_roles

        doc_ref.update(update_data)

        return {"success": True, "message": "Company data updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@app.get("/get-job-data/{uid}")
async def get_data_by_uid_data(uid: str):
    try:
        doc_ref = db.collection("companies").document(uid)
        doc = doc_ref.get()
        
        if doc.exists:
            return doc.to_dict()
        else:
        
            raise HTTPException(status_code=404, detail="Data not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/job-delete/{uid}")
async def delete_data(uid: str):
    try:
        doc_ref = db.collection("companies").document(uid)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Company not found")
            
        doc_ref.delete()
        return {"message": "Data deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get('/')
async def root():
    return {"message": "Welcome to the Job Portal API!"}
# Login/Signup Endpoints
class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    password: str

class UpdateAdminRequest(BaseModel):
    username: str
    isAdmin: bool
@app.post('/api/login')
async def login(request: LoginRequest):
    

    try:
        users_ref = db.collection("users")
        query = users_ref.where("username", "==", request.username).limit(1)
        docs = query.stream()
        
        user = None
        for doc in docs:
            user = doc.to_dict()
            user['id'] = doc.id
        
        if not user or user['password'] != request.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
            
        return {
            "message": "Login successful",
            "username": user['username'],
            "isAdmin": user.get('admin', False),
            "isTempAdmin": user.get('tempadmin', False)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
 # Add this new endpoint to your backend
class UpdateTempAdminRequest(BaseModel):
    username: str
    isTempAdmin: bool

@app.post('/api/update-user-tempadmin')
async def update_user_tempadmin(request: UpdateTempAdminRequest):
    try:
        users_ref = db.collection("users")
        query = users_ref.where("username", "==", request.username).limit(1)
        docs = query.stream()
        
        doc_ref = None
        for doc in docs:
            doc_ref = doc.reference
            
        if not doc_ref:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        doc_ref.update({
            "tempadmin": request.isTempAdmin,
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        
        return {
            "message": "User updated successfully",
            "username": request.username,
            "isTempAdmin": request.isTempAdmin
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
# Update your get-users endpoint to include tempadmin status
@app.get('/api/get-users')
async def get_users():
    try:
        users_ref = db.collection("users")
        docs = users_ref.stream()
        
        users_data = []
        for doc in docs:
            user = doc.to_dict()
            users_data.append({
                "username": user['username'],
                "isAdmin": user.get('admin', False),
                "tempadmin": user.get('tempadmin', False),  # Add this line
                "id": doc.id
            })
            
        return {"users": users_data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@app.post('/api/update-user-admin')
async def update_user_admin(request: UpdateAdminRequest):
    try:
        users_ref = db.collection("users")
        query = users_ref.where("username", "==", request.username).limit(1)
        docs = query.stream()
        
        doc_ref = None
        for doc in docs:
            doc_ref = doc.reference
            
        if not doc_ref:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        doc_ref.update({
            "admin": request.isAdmin,
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        
        return {
            "message": "User updated successfully",
            "username": request.username,
            "isAdmin": request.isAdmin
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


    
@app.post('/api/signup')
async def signup(request: SignupRequest):
    
    try:
        # Check if user exists
        
        users_ref = db.collection("users")
        query = users_ref.where("username", "==", request.username).limit(1)
        

        docs = query.stream()
       
        if any(docs):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists"
            )
            

        user_data = {
            "username": request.username,
            "password": request.password,
            "admin": False,
            "tempadmin": False,
            "created_at": firestore.SERVER_TIMESTAMP
        }
        
        _, doc_ref = users_ref.add(user_data)
        print(request)
        return {
            "message": "Signup successful",
            "username": request.username,
            "isAdmin": False,
            "isTempAdmin": False
        }
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)