<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    public function analyze(Request $request)
    {
        try {
            $imageUrl = $request->input('image_url');
            
            if (!$imageUrl) {
                 return response()->json(['error' => 'No image URL provided'], 400);
            }

            // Gọi thẳng qua máy chủ Python Flask đang chạy trên máy của bạn
            $response = Http::timeout(60)->post('http://localhost:7860/predict', [
                'image_url' => $imageUrl
            ]);

            if ($response->failed()) {
                throw new \Exception('Lỗi từ Server Python: ' . $response->body());
            }

            return response()->json($response->json());

        } catch (\Exception $e) {
            Log::error('Local AI Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Lỗi kết nối với máy chủ AI (Python)', 
                'details' => $e->getMessage()
            ], 500);
        }
    }
}