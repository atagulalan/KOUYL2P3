package com.xavame.bull

import android.support.v7.widget.RecyclerView
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import kotlinx.android.synthetic.main.kampanyacard.view.*

// https://developer.android.com/guide/topics/ui/layout/cardview
// https://medium.com/kouosl/kotlin-android-recylerview-kullan%C4%B1m%C4%B1-684caddfc808
class CardHolder(private val companies : MutableList<Map.CardPlate>) : RecyclerView.Adapter<CardHolder.CompanyViewHolder>() {
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CompanyViewHolder {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.kampanyacard,parent,false)
        return CompanyViewHolder(v)
    }

    override fun getItemCount(): Int {
        return companies.size
    }

    override fun onBindViewHolder(holder: CompanyViewHolder, position: Int) {
        val company = companies[position]
        holder.itemView.firmaAdi.text = company.FirmaAdi
        holder.itemView.kampanyaIcerik.text = company.KampanyaIcerik
        holder.itemView.kampanyaKategori.text = company.KampanyaKategori

        //https://stackoverflow.com/questions/10177552/how-do-i-create-a-unix-timestamp-on-android
        //https://stackoverflow.com/questions/22641728/creating-a-timer-which-shows-time-left-for-an-event-in-seconds-minutes-hours
        val unixTime = System.currentTimeMillis() / 1000L
        val millisToGo = (company.KampanyaTarih.toInt() - unixTime)*1000
        val minutes = (millisToGo / (1000 * 60) % 60).toInt()
        val hours = (millisToGo / (1000 * 60 * 60)).toInt()
        var text = String.format("%02d saat %02d dakika kaldı", hours, minutes)
        if(hours<0 || minutes<0){
            text = "Kampanya süresi dolmuştur."
        }
        holder.itemView.kampanyaTarih.text = text
    }

    class CompanyViewHolder(itemView: View): RecyclerView.ViewHolder(itemView)
}