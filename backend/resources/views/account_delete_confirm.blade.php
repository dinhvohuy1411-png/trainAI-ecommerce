<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { background: #ffffff; border-radius: 8px; padding: 30px; max-width: 500px; margin: 50px auto; text-align: center; }
        .icon { font-size: 60px; margin-bottom: 20px; }
        h1 { color: #1e293b; margin: 0 0 20px 0; }
        p { color: #64748b; margin: 0 0 30px 0; }
        .btn { display: inline-block; padding: 12px 30px; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .btn-danger { background: #ef4444; }
        .btn-secondary { background: #6b7280; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b; color: #92400e; text-align: left; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚠️</div>
        <h1>Xác nhận xóa tài khoản</h1>
        <p>Xin chào <strong>{{ $user->name }}</strong>,</p>

        <div class="warning">
            <strong>⚠️ Cảnh báo:</strong><br>
            Nếu bạn xác nhận xóa, tài khoản sẽ bị xóa <strong>vĩnh viễn</strong> và không thể khôi phục.
        </div>

        <p>Bạn có chắc chắn muốn xóa tài khoản này?</p>

        <form action="/account-delete/{{ $token }}/confirm" method="POST" style="display: inline-block; margin: 5px;">
            @csrf
            <button type="submit" class="btn btn-danger">🗑️ Xác nhận xóa</button>
        </form>

        <form action="/account-delete/{{ $token }}/cancel" method="POST" style="display: inline-block; margin: 5px;">
            @csrf
            <button type="submit" class="btn btn-secondary">❌ Hủy bỏ</button>
        </form>
    </div>
</body>
</html>
