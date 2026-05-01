<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

// Set user ID 1 to admin
$user = User::find(1);
if ($user) {
    $user->update(['role' => 'admin']);
    echo "✅ User ID 1 ({$user->email}) is now ADMIN!\n";
} else {
    echo "❌ User ID 1 not found\n";
}
