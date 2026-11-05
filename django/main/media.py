"""User uploads, served by Django with HTTP Range support.

Safari (iOS included) refuses to play a <video> whose server ignores Range
requests, and on the shared host nothing in front of gunicorn serves /media.
`django.views.static.serve` handles lookup, 404s and If-Modified-Since; this
view adds single-range `206 Partial Content` responses on top of it.
"""

import re

from django.conf import settings
from django.http import HttpResponse, StreamingHttpResponse
from django.views.static import serve

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")
CHUNK_SIZE = 64 * 1024
CACHE_CONTROL = "public, max-age=2592000"


def byte_range(header: str, size: int) -> tuple[int, int] | None:
    """(first, last) byte for a single `bytes=` range, or None when it cannot be satisfied.

    Raises ValueError for anything that is not a single byte range, so the
    caller can fall back to the whole file as RFC 9110 allows.
    """
    match = RANGE_RE.fullmatch(header.strip())
    if match is None:
        raise ValueError(header)

    first, last = match.groups()
    if not first and not last:
        raise ValueError(header)

    if not first:  # "bytes=-500": the final 500 bytes
        first_byte, last_byte = max(size - int(last), 0), size - 1
    else:
        first_byte = int(first)
        last_byte = min(int(last), size - 1) if last else size - 1

    if size == 0 or first_byte >= size or first_byte > last_byte:
        return None
    return first_byte, last_byte


def read_span(path: str, first: int, length: int):
    with open(path, "rb") as handle:
        handle.seek(first)
        while length > 0:
            chunk = handle.read(min(CHUNK_SIZE, length))
            if not chunk:
                return
            length -= len(chunk)
            yield chunk


def serve_media(request, path: str):
    response = serve(request, path, document_root=settings.MEDIA_ROOT)
    # Uploads keep their name for life (storage renames on collision), so a changed
    # file is a new URL and browsers can hold on to this one.
    response["Cache-Control"] = CACHE_CONTROL
    header = request.headers.get("Range")
    if response.status_code != 200 or not header:
        if response.status_code == 200:
            response["Accept-Ranges"] = "bytes"
        return response

    size = int(response["Content-Length"])
    try:
        span = byte_range(header, size)
    except ValueError:
        response["Accept-Ranges"] = "bytes"
        return response

    file_path = response.file_to_stream.name
    response.close()

    if span is None:
        refused = HttpResponse(status=416)
        refused["Content-Range"] = f"bytes */{size}"
        return refused

    first, last = span
    length = last - first + 1
    partial = StreamingHttpResponse(
        read_span(file_path, first, length), status=206, content_type=response["Content-Type"]
    )
    partial["Content-Length"] = str(length)
    partial["Content-Range"] = f"bytes {first}-{last}/{size}"
    partial["Accept-Ranges"] = "bytes"
    partial["Cache-Control"] = CACHE_CONTROL
    partial["Last-Modified"] = response["Last-Modified"]
    return partial
