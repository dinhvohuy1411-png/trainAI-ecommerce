<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Xác nhận xóa tài khoản</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { background: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; }
        .header { background: #ee4d2d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .btn { display: inline-block; background: #ee4d2d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffc107; }
        .footer { text-align: center; color: #888; font-size: 12px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Yêu cầu xóa tài khoản</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>{{ $user->name }}</strong>,</p>
            <p>Tài khoản của bạn đã được yêu cầu xóa bởi quản trị viên.</p>

            <div class="warning">
                <strong>⚠️ Cảnh báo:</strong><br>
                Nếu bạn không yêu cầu xóa tài khoản này, vui lòng bấm nút bên dưới để <strong>hủy yêu cầu</strong> và giữ lại tài khoản của bạn.
            </div>

            <p>Nếu bạn xác nhận xóa, tài khoản sẽ bị xóa vĩnh viễn sau khi bạn bấm xác nhận.</p>

            <p style="text-align: center; margin: 30px 0;">
                <a href="{{ url('/account-delete/' . $token) }}" class="btn">
                    🗑️ Xác nhận xóa tài khoản
                </a>
            </p>

            <p style="text-align: center;">
                <a href="{{ url('/account-delete/' . $token) }}" style="color: #888; text-decoration: underline;">
                    Hủy yêu cầu, giữ lại tài khoản
                </a>
            </p>

            <p><em>Lưu ý: Nếu bạn không thao tác trong vòng 7 ngày, tài khoản sẽ tự động bị xóa.</em></p>
        </div>
        <div class="footer">
            <p>© 2026 Shopii - Hệ thống thương mại điện tử</p>
        </div>
    </div>
</body>
</html>
