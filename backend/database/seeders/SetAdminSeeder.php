<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class SetAdminSeeder extends Seeder
{
    public function run()
    {
        $user = User::find(1);
        if ($user) {
            $user->update(['role' => 'admin']);
            echo "✅ User ID 1 ({$user->email}) is now ADMIN!\n";
        }
    }
}
