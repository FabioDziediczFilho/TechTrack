from starlette.middleware.cors import CORSMiddleware

from app.main import app


def test_cors_allows_project_vercel_previews_only():
    cors_middleware = next(
        middleware for middleware in app.user_middleware if middleware.cls is CORSMiddleware
    )
    cors = CORSMiddleware(app, **cors_middleware.kwargs)

    assert cors.is_allowed_origin(
        "https://tech-track-lqlx2ifaw-fabiodziediczfilhos-projects.vercel.app"
    )
    assert not cors.is_allowed_origin("https://attacker.vercel.app")
