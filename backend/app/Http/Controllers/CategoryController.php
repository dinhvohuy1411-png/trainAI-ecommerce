<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // Lấy danh sách (kèm danh mục con)
    public function index()
    {
        $categories = Category::with('children')->whereNull('parent_id')->get();
        return response()->json($categories);
    }

    // Thêm mới
    public function store(Request $request)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'slug' => 'nullable|string|max:255',
        'parent_id' => 'nullable|exists:categories,id',
        'image' => 'nullable|string'
    ]);

    $category = Category::create([
        'name' => $request->name,
        'slug' => $request->slug,
        'parent_id' => $request->parent_id ?: null,
        'image' => $request->image,
    ]);

    return response()->json($category, 201);
}

    // Cập nhật
    public function update(Request $request, $id)
{
    $category = Category::findOrFail($id);

    $request->validate([
        'name' => 'required|string|max:255',
        'slug' => 'nullable|string|max:255',
        'parent_id' => 'nullable|exists:categories,id',
        'image' => 'nullable|string'
    ]);

    $category->update([
        'name' => $request->name,
        'slug' => $request->slug,
        'parent_id' => $request->parent_id ?: null,
        'image' => $request->image,
    ]);

    return response()->json($category);
}

    // Xóa
    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        // Nếu có danh mục con thì không cho xóa
        if ($category->children()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with children'
            ], 400);
        }

        $category->delete();

        return response()->json([
            'message' => 'Deleted successfully'
        ]);
    }
}