<script setup lang="ts">


const urlParams = new URLSearchParams(window.location.search);
const instance_id = urlParams.get('id');

console.log("Viewer - instance_id from url", instance_id)

</script>

<template>

<video 
  id="remoteVideo" 
  playsinline 
  autoplay 
  muted></video>

<div id="overlay">This is HTML overlay on top of the video! </div>
  
</template>

<style>

#overlay {
  position: absolute; 
  top: 100px; 
  color: #FFF; 
  text-align: center;
  font-size: 20px;
  background-color: rgba(221, 221, 221, 0.3);
  width: 640px;
  padding: 10px 0;
  z-index: 2147483647;
}

#remoteVideo {
  z-index: 1;
}


</style>