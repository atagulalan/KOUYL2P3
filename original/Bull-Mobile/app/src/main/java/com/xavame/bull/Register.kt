package com.xavame.bull

import android.content.Intent
import android.graphics.Color
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.EditText
import android.widget.Toast
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.UserProfileChangeRequest
import kotlinx.android.synthetic.main.register.*

class Register : AppCompatActivity() {
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

    fun register(view: View) {
        Log.i("register", view.toString())
        if ( validation(registerEmail, registerPassword, registerDisplayName) ) {
            auth.createUserWithEmailAndPassword(registerEmail.text.toString(), registerPassword.text.toString())
                .addOnCompleteListener(this) { task ->
                    if (task.isSuccessful) {
                        // Sign in success, update UI with the signed-in user's information
                        Log.d("register", "createUserWithEmail:success")
                        Toast.makeText(this, "Kayıt başarılı. Yönlendiriliyor...", Toast.LENGTH_LONG).show()
                        val user = auth.currentUser
                        user?.updateProfile(UserProfileChangeRequest.Builder()
                            .setDisplayName(registerDisplayName.text.toString())
                            .build())
                            ?.addOnCompleteListener { updateTask ->
                                if (updateTask.isSuccessful) {
                                    Log.d("register", "User profile updated.")
                                    nextScreenUser()
                                }
                            }
                    } else {
                        // If sign in fails, display a message to the user.
                        Log.w("register", "createUserWithEmail:failure", task.exception)
                        Toast.makeText(baseContext, "Kayıt başarısız.", Toast.LENGTH_SHORT).show()
                    }
                }
        }
    }

    // Validate inputs, if error occurs, create Toast
    private fun validation(id: EditText, pw: EditText, dn: EditText): Boolean {
        return if ( id.text.toString() == "" || pw.text.toString() == "" || dn.text.toString() == "" ){
            Toast.makeText(this, "E-Posta, Görünen Ad veya Şifre boş olamaz.", Toast.LENGTH_LONG).show()
            false
        } else true
    }

    // After registering successfully, redirect to user page.
    private fun nextScreenUser(){
        finish()
        startActivity(Intent(this, User::class.java))
    }

    // On click of login link
    fun nextScreenLogin(view: View){
        Log.d("view", view.toString())
        finish()
    }
}
