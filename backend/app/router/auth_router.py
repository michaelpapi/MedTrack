from dotenv import load_dotenv
import httpx
import os
import random
import pyotp
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Body, Form
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt
from app.database import get_db
from app import crud, schemas, security, utils, models, email
from app.email import send_verification_email, send_password_reset_email
import requests as http

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=None)
def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    verification_code = str(random.randint(100000, 999999))
    user.is_active = False
    db_user = crud.create_user_with_verification(db, user, verification_code)

    background_tasks.add_task(
        email.send_verification_email,
        user.email,
        verification_code
    )
    
    return {"message": "Verification code sent to email", "email": user.email}


@router.post("/verify-email")
def verify_email(data: schemas.VerifyEmail, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    user.is_active = True
    user.verification_code = None
    db.commit()


@router.post(
        "/token",
        response_model=schemas.Token,
)
def get_user_access_token(
    form_data: OAuth2PasswordRequestForm=Depends(), db: Session = Depends(get_db)
):
    user = utils.authenticate_user(
        db, 
        form_data.username,
        form_data.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = security.create_access_token(
        data={"sub": user.username}
    )

    response = JSONResponse({"message": "Login successful"})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="Lax",
        secure=False
    )

    return response

@router.post("/google-login")
async def google_login(
    credentials: dict = Body(...),
    db: Session = Depends(get_db)
):
    try:
        # Check if we received a code or token
        if 'code' in credentials:
            # Exchange code for tokens using OAuth client
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                        "code": credentials["code"],
                        "grant_type": "authorization_code",
                        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI")
                    }
                )
                token_data = token_response.json()
                access_token = token_data.get("access_token")
        else:
            access_token = credentials.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="Invalid credentials"
            )

        # Get user info using the access token
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info = user_response.json()

        email = user_info.get("email")
        if not email:
            raise HTTPException(
                status_code=400, 
                detail="Could not get email from Google"
            )

        # Extract user information
        first_name = user_info.get("given_name", "")
        last_name = user_info.get("family_name", "")

        # Get or create user
        user = crud.get_user_by_email(db, email)
        username = utils.generate_unique_username(db, email)

        if not user:
            user = models.User(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_google_account=True,
                hashed_password="",  # Google users don't need a password
                created_at=datetime.now()
            )
            db.add(user)
            print(" SAVING USER:", user.__dict__)
            db.commit()
            db.refresh(user)

        # Create access token
        access_token = security.create_access_token({"sub": user.username})
        
        response = JSONResponse({"message": "Login successful"})
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite="Lax",
            secure=False
        )

        return response

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with Google: {str(e)}"
        )
    except Exception as e:
        print(" GOOGLE LOGIN ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )




# Allows forgotten password 

@router.post("/forgot-password")
async def forgot_password(
    data: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, data.email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_code = str(random.randint(100000, 999999))
    user.password_reset_code = reset_code
    db.commit()

    background_tasks.add_task(
    send_password_reset_email,
    to=data.email,
    subject="Password Reset Code",
    body=f"Your password reset code is: <b>{reset_code}</b>"
)


    return {"message": "Password reset code sent"}




@router.post("/forgot-password2")
async def forgot_password2( data: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):

    user = crud.get_user_by_email(db, data.email.lower())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_link = utils.create_reset_link(user.id)
    send_verification_email(user.email, reset_link)

    return {"message": "Reset email sent successfully"}
    


# then allow users to reset password 

@router.post("/reset-password")
def reset_password(data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, data.email.lower())
    if not user or user.password_reset_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    user.hashed_password = utils.hash_password(data.new_password)
    user.password_reset_code = None
    db.commit()

    return {"message": "Password reset successful!"}



@router.post("/reset-password2")
async def reset_password2(token: str = Form(...), new_password: str = Form(...), db:Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user = db.query(models.User).get(user_id)
    user.password = utils.hash_password(new_password)
    db.commit()

    return {"message": "Password updated successfully"}




@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user_details(
    user_id: int,
    update_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(security.get_current_user),
):
    """
    Update user details.
    - Only the logged-in user or an admin can update.
    """
    # check if the current user is updating their own record
    if current_user.id != user_id and not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile unless you are an admin."
        )
    
    db_user = crud.update_user(db, user_id, update_data.model_dump(exclude_unset=True))

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    return db_user


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: schemas.UserResponse = Depends(security.get_current_user)):
    return current_user


# ADMIN-FUNCTIONS 


@router.get("/all-users", response_model=list[schemas.UserResponse], dependencies=[Depends(security.get_current_user)])
def list_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Get a paginated list of all users.
    """
    users = security.get_all_users(db, skip=skip, limit=limit)
    return [
        utils.to_user_response(u) for u in users
    ]



@router.delete("/{user_id}", response_model=schemas.DeleteResponse, dependencies=[Depends(security.get_current_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Delete a user by ID.
    """
    return security.delete_user(db, user_id)



@router.post("/reg", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    

    db_user = crud.create_user(db, user)
    return db_user





# ------- MULTI FACTOR AUTH ENDPOINTS ------------

@router.post("/user/enable-mfa")
def enable_mfa(
    user: schemas.UserCreateResponse = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):

    secret = utils.generate_totp_secret()
    db_user = crud.get_user(db, user.username)
    db_user.totp_secret = secret
    db.add(db_user)
    db.commit()
    totp_uri = utils.generate_totp_uri(secret, user.email)

    # return the TOTP URI for QR code generation in the frontend
    return {
        "totp_uri": totp_uri,
        "secret_numbers": pyotp.TOTP(secret).now(),
        }
    

@router.post("/verify-totp")
def verify_totp(
    code: str,
    username: str,
    db: Session = Depends(get_db),
):
    user = crud.get_user(db, username)
    if not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not activated",
        )
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TOTP token"
        )
    # proceed with granting access or performing whatever sensitive operation
    return {
        "message": "TOTP token successfully verified."
    }


