package com.xavame.bull

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Color
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.support.design.widget.TabLayout
import android.support.v4.app.ActivityCompat
import android.support.v4.content.ContextCompat
import android.support.v7.widget.LinearLayoutManager
import android.util.Log
import android.view.View
import android.widget.*
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.beust.klaxon.*

import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.*
import kotlinx.android.synthetic.main.map.*
import java.io.StringReader



class Map : AppCompatActivity(), OnMapReadyCallback {
    private var locationManager : LocationManager? = null
    private lateinit var mMap: GoogleMap
    private var markers: MutableList<CardPlate> = mutableListOf()
    var rad = 1.0
    lateinit var person: Circle
    private lateinit var circle: Circle
    private var oldLocLat = 0.0
    private var oldLocLng = 0.0
    var tip = "current"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.map)

        //white status bar
        window.decorView.systemUiVisibility =View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        window.statusBarColor = Color.WHITE
        window.decorView.setBackgroundColor(Color.WHITE)

        // Create persistent LocationManager reference
        locationManager = getSystemService(LOCATION_SERVICE) as LocationManager?

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)

        getCategories()
        listenSeekBarInit()
        listenTabInit()

        recylerView.layoutManager = LinearLayoutManager(this,LinearLayout.VERTICAL,false)
        markers.forEach{
            Log.d("e",it.FirmaAdi)
        }
    }

    data class CardPlate(
        val FirmaAdi: String="",
        val KampanyaIcerik: String="",
        val KampanyaKategori: String="",
        val KampanyaTarih: String="",
        val Latitude: Double,
        val Longitude: Double,
        val MarkerObj: Marker
    )

    data class Lokasyon(
        val _latitude: Double,
        val _longitude: Double
    )
    data class Sure(
        val _seconds: Int,
        val _nanoseconds: Int
    )
    data class Item(
        val KampanyaIcerik: String,
        val KampanyaKategori: List<String>,
        val FirmaLokasyon: Lokasyon,
        val FirmaID: String,
        val FirmaAdi: String,
        val KampanyaSuresi: Sure
    )

    // Look out for the tab change
    private fun listenTabInit(){
        tabLayout.addOnTabSelectedListener(object: TabLayout.OnTabSelectedListener {
            override fun onTabUnselected(p0: TabLayout.Tab?) {}
            override fun onTabReselected(p0: TabLayout.Tab?) {}
            override fun onTabSelected(tab: TabLayout.Tab) {
                Log.d("tab",tab.position.toString())
                //will change to map or list
                if(tab.position==1){
                    mapWrapper.visibility = View.INVISIBLE
                    list.visibility = View.VISIBLE
                }else if(tab.position==0){
                    mapWrapper.visibility = View.VISIBLE
                    list.visibility = View.INVISIBLE
                }
            }
        })
    }

    // Look out for the distance slider change
    private fun listenSeekBarInit(){
        seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            @SuppressLint("SetTextI18n")
            override fun onProgressChanged(seekBar: SeekBar, i: Int, b: Boolean) {
                if((i+1)<10){
                    kmVal.text = "${(i+1)*100}m"
                }else{
                    kmVal.text = "${(i+1)/10.0}km"
                }
            }
            override fun onStartTrackingTouch(seekBar: SeekBar) {
                Toast.makeText(applicationContext,"Çevre değiştiriliyor...",Toast.LENGTH_SHORT).show()
            }
            override fun onStopTrackingTouch(seekBar: SeekBar) {
                rad = (seekBar.progress+1)/10.0
                getMarkers(person.center.latitude, person.center.longitude, rad)
            }
        })
    }

    // Mask markers according to filters
    private fun maskTheMarkers(){
        // https://stackoverflow.com/questions/44674532/how-to-filter-a-list-in-place-with-kotlin

        fun retainByCategory(it: CardPlate, category: String): Boolean {
            return (it.KampanyaKategori+",").contains("$category,")
        }
        fun retainBySearch(it: CardPlate, search: String): Boolean {
            return (it.FirmaAdi).toLowerCase().contains(search.toLowerCase()) || (it.KampanyaIcerik).toLowerCase().contains(search.toLowerCase())
        }

        // Clone the markers
        val maskedMarkers: MutableList<CardPlate> = markers.toMutableList()
        if(spinner.selectedItemPosition!=0){
            maskedMarkers.retainAll { retainByCategory(it, spinner.selectedItem.toString()) }
        }
        if(textFilter.text.toString()!="") {
            maskedMarkers.retainAll { retainBySearch(it, textFilter.text.toString()) }
        }
        Log.d("maskTheMarkers","POS=${spinner.selectedItemPosition}, ID=${spinner.selectedItem}, SEARCH=${textFilter.text}")

        clearMarkers()
        maskedMarkers.forEach {
            addMarker(
                it.FirmaAdi,
                it.KampanyaIcerik,
                it.KampanyaKategori,
                it.KampanyaTarih,
                it.Latitude,
                it.Longitude
            )
        }

        recylerView.adapter = CardHolder(markers)
    }

    // Get categories and fill the dropdown menu
    private fun getCategories(){
        // https://stackoverflow.com/questions/13377361/how-to-create-a-drop-down-list?rq=1
        val listOfCategories = mutableListOf("Tümü")

        // https://stackoverflow.com/questions/41928803/how-to-parse-json-in-kotlin
        // https://github.com/Kotlin/kotlinx.serialization
        val req = object : JsonObjectRequest(
            Method.GET, "https://bull-41.firebaseapp.com/categories", null,
            Response.Listener { responseJsonObj ->
                val klaxon = Klaxon()
                val parsed = klaxon.parseJsonObject(StringReader(responseJsonObj.toString().trimIndent()))
                val dataArray = parsed.array<Any>("returnObj")
                val items = dataArray?.let { klaxon.parseFromJsonArray<String>(it) }
                items?.forEach {
                    listOfCategories += it
                }
                //Toast.makeText(this,"Response=$it",Toast.LENGTH_SHORT).show()
            },
            Response.ErrorListener {
                Toast.makeText(this,"Hiç kategori bulunamadı.",Toast.LENGTH_SHORT).show()
            }
        ){}
        VolleySingleton.getInstance(this).addToRequestQueue(req)

        //create an adapter to describe how the items are displayed, adapters are used in several places in android.
        //There are multiple variations of this, but this is the basic variant.
       val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, listOfCategories)
        //set the spinners adapter to the previously created one.
        spinner.adapter = adapter
    }

    fun clearMarkers(){
        // Remove all markers from map
        markers.forEach{
            it.MarkerObj.remove()
        }
        // and from list
        markers.clear()

        // Update adapter
        recylerView.adapter = CardHolder(markers)
    }

    fun addMarker(title: String, desc: String, cat: String, time: String, lat: Double, lng: Double){
        // Set the color for marker
        val icon = BitmapDescriptorFactory
            .defaultMarker(BitmapDescriptorFactory.HUE_AZURE)

        // Add marker to the map
        val marker = mMap.addMarker(
            MarkerOptions()
                .position(LatLng(lat, lng))
                .icon(icon)
                .title(title)
                .snippet(cat)
        )

        //marker.showInfoWindow()

        // And add the reference to list for further removal
        markers.add(
            CardPlate(
                title,
                desc,
                cat,
                time,
                lat,
                lng,
                marker
            )
        )
    }

    fun getMarkers(lat: Double, lng: Double, rad: Double) {
        changeRad(lat, lng)
        Toast.makeText(this,"Güncelleniyor...",Toast.LENGTH_SHORT).show()
        // Then, send a request
        val req = object : JsonObjectRequest(
            Method.POST, "https://bull-41.firebaseapp.com/radius", null,
            Response.Listener {
                // https://stackoverflow.com/questions/41928803/how-to-parse-json-in-kotlin
                // https://github.com/Kotlin/kotlinx.serialization
                val json = it.toString().trimIndent()
                val klaxon = Klaxon()
                val items = klaxon
                    .parseJsonObject(StringReader(json))
                    .array<Any>("returnObj")
                    ?.let { item -> klaxon.parseFromJsonArray<Item>(item) }

                clearMarkers()
                items?.forEach { item ->
                    addMarker(
                        item.FirmaAdi,
                        item.KampanyaIcerik,
                        item.KampanyaKategori.joinToString{ k -> k },
                        item.KampanyaSuresi._seconds.toString(),
                        item.FirmaLokasyon._latitude,
                        item.FirmaLokasyon._longitude
                    )
                }

                // Then, if filter is on, mask the markers
                maskTheMarkers()
            },
            Response.ErrorListener {
                clearMarkers()
                Toast.makeText(this,"Yakınınızda hiç fırsat yok.",Toast.LENGTH_SHORT).show()
            }
        ) {
            override fun getBody(): ByteArray {
                Log.d("getBody", "RAD=$rad, LAT=$lat, LNG=$lng")
                return """
                    {
                        "currentLocation":{
                            "lat":$lat,
                            "lng":$lng
                        },
                        "radius":$rad
                    }
                """.toByteArray()
            }

        }
        VolleySingleton.getInstance(this).addToRequestQueue(req)
    }

    // Change radius of the circle and move the camera to
    private fun changeRad(lat: Double, lng: Double){
        circle.radius = rad*1000.0
        // Maybe find a better solution?
        var zoom = 14f
        when {
            rad <= 1 -> zoom = 14f
            rad <= 3 -> zoom = 13f
            rad <= 6 -> zoom = 12f
            rad <= 12 -> zoom = 11f
            rad <= 24 -> zoom = 10f
            rad <= 48 -> zoom = 9f
            rad <= 96 -> zoom = 8f
            rad <= 192 -> zoom = 7f
        }
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(lat,lng),zoom))
    }

    // Change latitude and longitude of the center
    fun changeCenter(location: Location?){
        val latitude = location!!.latitude
        val longitude = location.longitude
        circle.center = LatLng(latitude,longitude)
        person.center = LatLng(latitude,longitude)
        // Check if he/she moving, if so, change the center accordingly
        if((Math.abs(oldLocLat - latitude) + Math.abs(oldLocLng - longitude)) > 0.001){
            oldLocLat = latitude
            oldLocLng = longitude
            Log.d("changeCenter", "LAT=$latitude, LNG=$longitude")
            getMarkers(latitude, longitude, rad)
        }else{
            Log.d("changeCenter", "NO CHANGE")
            //Toast.makeText(this,"Yürümüyorsun.",Toast.LENGTH_SHORT).show()
        }
        mMap.cameraPosition.target
    }

    // Source: https://medium.com/@manuaravindpta/getting-current-location-in-kotlin-30b437891781
    // Gets current location
    private fun getLocation() {
        // Create a location manager and listener
        val locationManager = getSystemService(LOCATION_SERVICE) as LocationManager?
        val locationListener = object : LocationListener{
            override fun onLocationChanged(location: Location?) { if(tip=="current") changeCenter(location) }
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String?) {}
            override fun onProviderDisabled(provider: String?) {}
        }

        // Try to access location, if location is not accessible, warn user
        try {
            locationManager!!.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, locationListener)
        } catch (ex:SecurityException) {
            Toast.makeText(applicationContext, "Lokasyon erişimi engelli!", Toast.LENGTH_SHORT).show()
        }

        // Ask for permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
                PERMISSION_REQUEST_ACCESS_FINE_LOCATION)
            return
        }

        // Request location information (From GPS and Network)
        locationManager!!.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0L, 0f, locationListener)
        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, locationListener)
    }

    // Gets permission for location information
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_ACCESS_FINE_LOCATION) {
            when (grantResults[0]) {
                PackageManager.PERMISSION_GRANTED -> getLocation()
                PackageManager.PERMISSION_DENIED ->  Toast.makeText(applicationContext, "Lokasyon erişimi kısıtlı!", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Runs when select location button is pressed
    fun selectLocation(view: View) {
        Log.d("selectLocation", "VIEW=$view")
        //select map center location
        tip = "select"
        val targetLocation = Location("user")
        targetLocation.latitude = mMap.cameraPosition.target.latitude
        targetLocation.longitude = mMap.cameraPosition.target.longitude
        changeCenter(targetLocation)
    }

    // Runs when current location button is pressed
    fun currentLocation(view: View) {
        Log.d("currentLocation", "VIEW=$view")
        //select current location
        tip = "current"
    }

    // Runs when filter button is pressed
    fun filterButtonClick(view: View) {
        Log.d("filterButtonClick", "VIEW=$view")
        //just refresh, it'll mask
        getMarkers(person.center.latitude, person.center.longitude, rad)
    }

    // Runs when map sources are fully loaded
    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap

        // Set the map theme
        // Exact same map theme we use on admin panel
        val myMapStyle = """
            [{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"on"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}]
        """.trimIndent()
        val style = MapStyleOptions(myMapStyle)
        mMap.setMapStyle(style)

        // Add radius circle
        circle = mMap.addCircle(
            CircleOptions()
                .center(LatLng(0.0,0.0))
                .radius(rad*1000.0)
                .strokeColor(Color.argb(150, 77, 125, 254))
                .fillColor(Color.argb(50, 77, 125, 254))
        )

        // Add approximate standing point
        person = mMap.addCircle(
            CircleOptions()
                .center(LatLng(0.0,0.0))
                .radius(10.0)
                .strokeColor(Color.argb(150, 77, 125, 254))
                .fillColor(Color.argb(150, 77, 125, 254))
        )

        // Limit zoom
        mMap.setMinZoomPreference(6.0f)
        mMap.setMaxZoomPreference(18.0f)

        // Get current (or selected) location to pinpoint on map
        getLocation()
    }

    companion object {
        private const val PERMISSION_REQUEST_ACCESS_FINE_LOCATION = 100
    }
}