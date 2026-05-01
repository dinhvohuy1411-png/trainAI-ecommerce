<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { background: #ffffff; border-radius: 8px; padding: 30px; max-width: 500px; margin: 50px auto; text-align: center; }
        .error-icon { font-size: 60px; margin-bottom: 20px; }
        h1 { color: #ef4444; margin: 0 0 20px 0; }
        p { color: #64748b; margin: 0 0 20px 0; }
        .btn { display: inline-block; padding: 12px 30px; background: #ee4d2d; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .btn-secondary { background: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">⚠️</div>
        <h1>{{ $title }}</h1>
        <p>{{ $error }}</p>
        <a href="/" class="btn"> Quay về trang chủ </a>
    </div>
</body>
</html>
