from django.urls import path

from main import views

app_name = "api"

urlpatterns = [
    path("site/", views.SiteView.as_view(), name="site"),
    path("message/", views.MessageView.as_view(), name="message"),
    path("subscribe/", views.SubscribeView.as_view(), name="subscribe"),
]
