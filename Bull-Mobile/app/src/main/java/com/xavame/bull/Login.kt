package com.xavame.bull

import android.content.Intent
import android.graphics.Color
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import android.widget.EditText
import com.google.firebase.auth.FirebaseAuth
import kotlinx.android.synthetic.main.login.*

// https://firebase.google.com/docs/android/setup?authuser=0
// https://firebase.google.com/docs/android/setup

class Login : AppCompatActivity() {
    private lateinit var auth: FirebaseAuth
    override fun onCreate(savedInstanceState: Bundle?) {
        // Initialize Layout
        super.onCreate(savedInstanceState)
        setContentView(R.layout.register)

        // Change status bar to white
        window.decorView.systemUiVisibility =View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        window.statusBarColor = Color.WHITE
        window.decorView.setBackgroundColor(Color.WHITE)

        // Initialize Firebase
        auth = FirebaseAuth.getInstance()
    }

    public override fun onStart() {
        super.onStart()
        // Check if user is signed in (non-null) and update UI accordingly.
        val currentUser = auth.currentUser
        if(currentUser != null){
            Toast.makeText(this, currentUser.toString(), Toast.LENGTH_LONG).show()
            nextScreenUser()
        }
    }

    private fun validation(id: EditText, pw: EditText): Boolean {
        return if ( id.text.toString() == "" || pw.text.toString() == "" ){
            Toast.makeText(this, "E-Posta veya Şifre boş olamaz.", Toast.LENGTH_LONG).show()
            false
        } else true
    }

    fun login(view: View) {
        Log.d("view", view.toString())
        if ( validation(loginEmail , loginPassword) ) {
            auth.signInWithEmailAndPassword(loginEmail.text.toString(), loginPassword.text.toString())
                .addOnCompleteListener(this) { task ->
                    if (task.isSuccessful) {
                        // Sign in success, update UI with the signed-in user's information
                        auth.currentUser
                        Toast.makeText(this, "Giriş başarılı.", Toast.LENGTH_LONG).show()
                        nextScreenUser()
                    } else {
                        // If sign in fails, display a message to the user.
                        Toast.makeText(baseContext, "Giriş başarısız.", Toast.LENGTH_SHORT).show()
                    }
                }
        }
    }

    // After logging in successfully, redirect to user page.
    private fun nextScreenUser(){
        startActivity(Intent(this, User::class.java))
    }

    // On click of register link
    fun nextScreenRegister(view: View){
        Log.d("view",view.toString())
        startActivity(Intent(this, Register::class.java))
    }
}
