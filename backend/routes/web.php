<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect('/users');
});


/*
|--------------------------------------------------------------------------
| SHOW USER DETAIL
|--------------------------------------------------------------------------
*/

Route::get('/users/{id}', function ($id) {

    $user = User::findOrFail($id);

    return "
    <h1>User Detail</h1>

    ID: $user->id <br>
    Name: $user->name <br>
    Email: $user->email <br><br>

    <a href='/users'>Back</a>
    ";
});


/*
|--------------------------------------------------------------------------
| USERS CRUD PAGE
|--------------------------------------------------------------------------
*/

Route::match(['get','post'],'/users', function(Request $request){

    // CREATE
    if($request->isMethod('post')){
        User::create([
            'name'=>$request->name,
            'email'=>$request->email,
            'password'=>bcrypt('123456')
        ]);
    }

    $users = User::orderBy('id','desc')->get();

    $rows = "";

    foreach($users as $user){

        $rows .= "

        <tr>

        <td>$user->id</td>

        <td>
        <form method='POST' action='/users/$user->id/update'>
        <input type='hidden' name='_token' value='".csrf_token()."'>
        <input type='text' name='name' value='$user->name'>
        </td>

        <td>
        <input type='text' name='email' value='$user->email'>
        </td>

        <td>

        <button class='update'>Update</button>
        </form>

        <form method='POST' action='/users/$user->id/delete' style='display:inline'>
        <input type='hidden' name='_token' value='".csrf_token()."'>
        <button class='delete'>Delete</button>
        </form>

        <a href='/users/$user->id'>
        <button class='view'>View</button>
        </a>

        </td>

        </tr>

        ";
    }

    return response()->make("

<html>

<head>

<title>User CRUD</title>

<style>

body{
font-family: Arial;
background:#f5f5f5;
padding:40px;
}

table{
border-collapse: collapse;
width:100%;
background:white;
}

th,td{
padding:10px;
border:1px solid #ddd;
}

th{
background:#f0f0f0;
}

input{
padding:6px;
width:90%;
}

button{
padding:6px 10px;
border:none;
color:white;
cursor:pointer;
margin-right:5px;
}

.create{background:#3498db;}
.update{background:#3498db;}
.delete{background:#e74c3c;}
.view{background:#2ecc71;}

.top-form{
margin-bottom:20px;
}

</style>

</head>

<body>

<h1>User CRUD</h1>

<p style='color:#555; margin-bottom:15px;'>
Note: Điền thông tin mới vào từng dòng trong table và bấm <b>Update</b> để thay đổi.
</p>
<form method='POST' class='top-form'>

<input type='hidden' name='_token' value='".csrf_token()."'>

<input name='name' placeholder='Name' required>

<input name='email' placeholder='Email' required>

<button class='create'>Create</button>

</form>

<table>

<tr>
<th>ID</th>
<th>Name</th>
<th>Email</th>
<th>Actions</th>
</tr>

$rows

</table>

</body>

</html>

");

});


/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

Route::post('/users/{id}/update', function(Request $request,$id){

    $user = User::findOrFail($id);

    $user->update([
        'name'=>$request->name,
        'email'=>$request->email
    ]);

    return redirect('/users');

});


/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

Route::post('/users/{id}/delete', function($id){

    User::findOrFail($id)->delete();

    return redirect('/users');

});