<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Mail\AccountDeletionMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AutoDeleteInactiveUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:auto-delete-inactive {days=30 : Số ngày không hoạt động} {--dry-run : Chỉ hiển thị không thực hiện}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động gửi email xóa tài khoản cho user không hoạt động trong N ngày';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->argument('days');
        $dryRun = $this->option('dry-run');

        $this->info("=== Tự động xóa user không hoạt động trong {$days} ngày ===");

        // Lấy các user không hoạt động
        $inactiveUsers = User::where('role', '!=', 'admin')
            ->where('created_at', '<', Carbon::now()->subDays($days))
            ->where(function ($query) {
                // User chưa từng đăng nhập hoặc đã lâu không đăng nhập
                $query->whereNull('last_login_at')
                      ->orWhere('last_login_at', '<', Carbon::now()->subDays($days));
            })
            ->whereNull('deleted_at') // Chưa bị xóa mềm
            ->whereDoesntHave('orders', function ($q) {
                // Không có đơn hàng nào trong thời gian inactive
                $q->where('created_at', '>', Carbon::now()->subDays(config('shop.inactive_days', 30)));
            })
            ->get();

        $this->info("Tìm thấy {$inactiveUsers->count()} user không hoạt động");

        if ($dryRun) {
            $this->warn('DRY RUN - Không thực hiện xóa');
            $this->table(['ID', 'Name', 'Email', 'Role', 'Last Login'], $inactiveUsers->map(fn($u) => [
                $u->id,
                $u->name,
                $u->email,
                $u->role,
                $u->last_login_at ?? 'Never',
            ])->toArray());
            return;
        }

        $bar = $this->output->createProgressBar($inactiveUsers->count());
        $bar->start();

        $deleted = 0;
        $skipped = 0;

        foreach ($inactiveUsers as $user) {
            try {
                // Tạo token
                $token = Str::random(64);
                $user->deletion_token = $token;
                $user->deletion_expires_at = Carbon::now()->addDays(7)->toDateTimeString();
                $user->save();

                // Gửi email
                Mail::to($user->email)->send(new AccountDeletionMail($user, $token));

                // Soft delete
                $user->delete();

                $deleted++;
                $this->info("\nĐã gửi email xóa cho: {$user->email}");
            } catch (\Exception $e) {
                $skipped++;
                $this->error("\nLỗi khi xử lý user {$user->email}: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Hoàn tất! Đã xử lý: {$deleted} user, skipped: {$skipped}");
    }
}
