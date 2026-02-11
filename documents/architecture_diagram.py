#!/usr/bin/env python3
"""
MyBlog-AWS Architecture Diagram Generator
AWS公式アイコンを使用したアーキテクチャ図を生成

Usage:
  python3 architecture_diagram.py

Requirements:
  pip install diagrams
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.storage import S3
from diagrams.aws.network import CF, APIGateway
from diagrams.aws.security import Cognito
from diagrams.onprem.client import Users, User

# グラフ設定
graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "0.5",
}

# 概要図
with Diagram(
    "MyBlog-AWS Architecture Overview",
    filename="documents/assets/images/architecture_overview",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
):
    # ユーザー
    users = Users("General Users")
    admin = User("Admin")
    
    with Cluster("CDN Layer"):
        cf_web = CF("CloudFront\n(Frontend)")
        cf_media = CF("CloudFront\n(Media)")
    
    with Cluster("AppStack (Stateless)"):
        s3_web = S3("S3 Bucket\n(Frontend)")
        api = APIGateway("API Gateway\nREST API")
        
        with Cluster("Lambda Functions"):
            lambda_get_posts = Lambda("get-posts")
            lambda_get_post = Lambda("get-post")
            lambda_create = Lambda("create-post")
            lambda_update = Lambda("update-post")
            lambda_delete = Lambda("delete-post")
            lambda_presigned = Lambda("generate-presigned-url")
    
    with Cluster("DataStack (Stateful)"):
        dynamodb = Dynamodb("DynamoDB\nBlogTable")
        s3_media = S3("S3 Bucket\n(Media)")
        cognito = Cognito("Cognito\nUser Pool")
    
    # フロー
    users >> cf_web >> s3_web
    users >> api
    admin >> Edge(label="JWT") >> api
    admin >> cognito
    
    cf_media >> s3_media
    
    api >> [lambda_get_posts, lambda_get_post, lambda_create, 
            lambda_update, lambda_delete, lambda_presigned]
    
    [lambda_get_posts, lambda_get_post] >> Edge(label="Read") >> dynamodb
    [lambda_create, lambda_update, lambda_delete] >> Edge(label="Write") >> dynamodb
    lambda_presigned >> s3_media


# 詳細図
with Diagram(
    "MyBlog-AWS Architecture Details",
    filename="documents/assets/images/architecture_details",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
):
    # ユーザー層
    with Cluster("Users"):
        general_user = Users("General Users\n(Public Access)")
        admin_user = User("Administrator\n(Auth Required)")
    
    # CDN層
    with Cluster("CloudFront Distributions"):
        cf_frontend = CF("Frontend Distribution\nd1234567890.cloudfront.net")
        cf_media_dist = CF("Media Distribution\nd0987654321.cloudfront.net")
    
    # AppStack
    with Cluster("AppStack - Stateless Resources"):
        # Frontend
        with Cluster("Frontend Hosting"):
            s3_frontend = S3("S3 Bucket\nFrontend Assets\nHTML/CSS/JS")
        
        # API Gateway
        with Cluster("API Gateway"):
            api_gw = APIGateway("REST API\nMyBlog API")
            
            with Cluster("Public Endpoints"):
                ep_posts = APIGateway("/posts")
                ep_post_id = APIGateway("/posts/{id}")
            
            with Cluster("Admin Endpoints"):
                ep_admin_posts = APIGateway("/admin/posts")
                ep_admin_post_id = APIGateway("/admin/posts/{id}")
                ep_presigned = APIGateway("/admin/presigned-url")
        
        # Lambda関数
        with Cluster("Lambda Functions"):
            with Cluster("Read Operations"):
                lambda_get_posts_fn = Lambda("get-posts\n128MB/10s\n記事一覧")
                lambda_get_post_fn = Lambda("get-post\n128MB/10s\n記事詳細")
            
            with Cluster("Write Operations"):
                lambda_create_fn = Lambda("create-post\n128MB/10s\n記事作成")
                lambda_update_fn = Lambda("update-post\n128MB/10s\n記事更新")
                lambda_delete_fn = Lambda("delete-post\n128MB/10s\n記事削除")
            
            with Cluster("Media Operations"):
                lambda_presigned_fn = Lambda("generate-presigned-url\n128MB/10s\nURL生成")
    
    # DataStack
    with Cluster("DataStack - Stateful Resources"):
        # Database
        with Cluster("Database"):
            ddb_table = Dynamodb("DynamoDB Table\nBlogTable\nOn-Demand")
        
        # Media Storage
        with Cluster("Media Storage"):
            s3_media_bucket = S3("S3 Bucket\nMedia Files\nImages/Videos")
        
        # Authentication
        with Cluster("Authentication"):
            cognito_pool = Cognito("Cognito User Pool\nAdmin Auth")
    
    # フロー: Frontend
    general_user >> cf_frontend >> s3_frontend
    
    # フロー: Public API
    general_user >> ep_posts >> lambda_get_posts_fn
    general_user >> ep_post_id >> lambda_get_post_fn
    
    # フロー: Admin Authentication
    admin_user >> cognito_pool
    
    # フロー: Admin API
    admin_user >> Edge(label="JWT") >> ep_admin_posts >> lambda_get_posts_fn
    admin_user >> Edge(label="JWT") >> ep_admin_post_id
    ep_admin_post_id >> [lambda_get_post_fn, lambda_update_fn, lambda_delete_fn]
    admin_user >> Edge(label="JWT") >> ep_presigned >> lambda_presigned_fn
    
    # フロー: Lambda → DynamoDB
    [lambda_get_posts_fn, lambda_get_post_fn] >> Edge(label="Query") >> ddb_table
    [lambda_create_fn, lambda_update_fn, lambda_delete_fn] >> Edge(label="TransactWrite") >> ddb_table
    
    # フロー: Lambda → S3
    lambda_presigned_fn >> Edge(label="Generate URL") >> s3_media_bucket
    admin_user >> Edge(label="PUT") >> s3_media_bucket
    
    # フロー: Media Delivery
    s3_media_bucket >> cf_media_dist
    general_user >> cf_media_dist


print("✅ Architecture diagrams generated successfully!")
print("📁 Files created:")
print("   - documents/assets/images/architecture_overview.png")
print("   - documents/assets/images/architecture_details.png")
print("")
print("🎨 To customize the diagrams:")
print("   1. Edit architecture_diagram.py")
print("   2. Run: python3 architecture_diagram.py")
print("")
print("📖 Documentation: https://diagrams.mingrammer.com/")
