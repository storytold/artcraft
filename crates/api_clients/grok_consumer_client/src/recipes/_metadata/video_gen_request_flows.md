Upload Image -> Video Flow
==========================

1. Upload Image

  Endpoint: https://grok.com/rest/app-chat/upload-file

  Response Fields:
    {
      **"fileMetadataId": "21a79085-e206-4b0b-88ac-5f2b7a453e45",**
      **"fileUri": "users/85980643-ffab-4984-a3de-59a608c47d7f/21a79085-e206-4b0b-88ac-5f2b7a453e45/content",**
      "fileMimeType": "image/jpeg",
      "fileName": "0_0.jpeg",
      "parsedFileUri": "",
      "createTime": "2025-10-21T23:40:41.784448Z",
      "fileSource": "SELF_UPLOAD_FILE_SOURCE"
    }


  File becomes a 480x640 copy:

  https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/21a79085-e206-4b0b-88ac-5f2b7a453e45/content

2. "Create Media Post" **(needed?)**

  Endpoint: https://grok.com/rest/media/post/create

  Request Fields: 
    {
      "mediaType": "MEDIA_POST_TYPE_IMAGE",
      "mediaUrl": "https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/21a79085-e206-4b0b-88ac-5f2b7a453e45/content"
    }

  Response: 
      {
         "post": {
            "id": "21a79085-e206-4b0b-88ac-5f2b7a453e45",
            "userId": "85980643-ffab-4984-a3de-59a608c47d7f",
            "createTime": "2025-10-21T23:40:41.993980477Z",
            "prompt": "",
            "mediaType": "MEDIA_POST_TYPE_IMAGE",
            "mediaUrl": "https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/21a79085-e206-4b0b-88ac-5f2b7a453e45/content",
            "mimeType": "image/jpeg",
            "audioUrls": [],
            "childPosts": []
         }
      }

3. Chat Conversation for Video

  Endpoint: https://grok.com/rest/app-chat/conversations/new

  Request:
    {
      "temporary":true,
      "modelName":"grok-3",
      "message":"https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/21a79085-e206-4b0b-88ac-5f2b7a453e45/content  --mode=normal",
      "fileAttachments":["21a79085-e206-4b0b-88ac-5f2b7a453e45"],
      "toolOverrides": {
        "videoGen":true
      }
    }

Header 'x-xai-request-id: 7cb93340-5fb6-4fb3-b88d-ff9f5d99d456' is just a random UUID and it can be changed.


Generate Image -> Video Flow
============================

(TODO)

2. Create Media Post

  Request
    {
      "mediaType": "MEDIA_POST_TYPE_IMAGE",
      "mediaUrl":"https://imagine-public.x.ai/imagine-public/images/2d8260d7-3b7c-4bc1-84ca-6e82dd892c39.png"
    }


3. Chat Conversation for Video

   Endpoint: https://grok.com/rest/app-chat/conversations/new

   Request:
     {
       "temporary": true,
       "modelName": "grok-3",
       "message": "https://imagine-public.x.ai/imagine-public/images/2d8260d7-3b7c-4bc1-84ca-6e82dd892c39.png  alien walks down the hallway --mode=custom",
       "toolOverrides": {
         "videoGen":true
       }
     } 
