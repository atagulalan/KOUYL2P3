package com.xavame.bull

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import com.google.firebase.auth.FirebaseAuth
import android.widget.*
import kotlinx.android.synthetic.main.user.*

class User : AppCompatActivity() {
    private lateinit var auth: FirebaseAuth
    override fun onCreate(savedInstanceState: Bundle?) {
        //init
        super.onCreate(savedInstanceState)
        setContentView(R.layout.user)

        //white status bar
        window.decorView.systemUiVisibility =View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        window.statusBarColor = Color.WHITE
        window.decorView.setBackgroundColor(Color.WHITE)

        //auth
        auth = FirebaseAuth.getInstance()
    }

    @SuppressLint("SetTextI18n")
    public override fun onStart() {
        super.onStart()
        // Check if user is signed in (non-null) and update UI accordingly.
        val currentUser = auth.currentUser
        textView6.text = "Tekrar Hoşgeldin,\n"+currentUser?.displayName
        //Toast.makeText(this, currentUser?.displayName, Toast.LENGTH_LONG).show()
    }

    /** Called when the user taps the Login button  */
    fun logout(view: View) {
        Log.d("view", view.toString())
        // Do something in response to button
        Toast.makeText(this, "Çıkış yapılıyor...", Toast.LENGTH_LONG).show()
        FirebaseAuth.getInstance().signOut()
        finish()
    }

    fun nextScreenMap(view: View){
        Log.d("view", view.toString())
        startActivity(Intent(this, Map::class.java))
    }

    fun passwordReset(view: View){
        Log.d("view", view.toString())
        val user = FirebaseAuth.getInstance().currentUser
        val newPassword = yeniSifre.text.toString()

        user?.updatePassword(newPassword)
            ?.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d("passwordUpdate", "User password updated.")
                    Toast.makeText(this, "Şifre değiştirildi, lütfen tekrar giriş yapın.", Toast.LENGTH_LONG).show()
                    FirebaseAuth.getInstance().signOut()
                    finish()
                }else{
                    Toast.makeText(this, "Şifre değiştirilirken hata.", Toast.LENGTH_LONG).show()
                    Log.d("passwordUpdate", "HATA HATA BİP BOP.")
                }
            }
    }
}
