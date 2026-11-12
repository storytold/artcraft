package ai.artcraft.mobile

import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.util.Log
import android.webkit.MimeTypeMap
import androidx.activity.result.contract.ActivityResultContracts
import com.google.androidgamesdk.GameActivity
import java.io.File

/**
 * Hosts the Rust app (`libartcraft_native.so`, entry point `android_main`) and does the few things
 * that need the Android SDK: opening links, choosing files and saving downloads to the gallery.
 *
 * Rust calls [openUrl], [requestPick] and [publishMedia] over JNI from its own thread (see
 * `src/platform/android.rs`). Everything here returns quickly: the picker result comes back later
 * through [nativeOnPicked], because the native thread must stay free to answer the activity
 * lifecycle while the picker is on screen.
 */
class MainActivity : GameActivity() {

  companion object {
    private const val TAG = "ArtCraft"

    init {
      System.loadLibrary("artcraft_native")
    }
  }

  /** Which Rust-side request the picker on screen belongs to. */
  private var pendingKey = -1

  private val pickOne =
      registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        finishPick(listOfNotNull(uri))
      }

  private val pickMany =
      registerForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        finishPick(uris)
      }

  /** Implemented in Rust: `Java_ai_artcraft_mobile_MainActivity_nativeOnPicked`. */
  private external fun nativeOnPicked(key: Int, paths: Array<String>)

  /** Opens a link or media URL in whichever app handles it. */
  fun openUrl(url: String): Boolean =
      try {
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
      } catch (e: Exception) {
        Log.w(TAG, "No app can open $url", e)
        false
      }

  /** Shows the system document picker for [mimeTypes]; the result goes to [nativeOnPicked]. */
  fun requestPick(key: Int, mimeTypes: Array<String>, multiple: Boolean) {
    runOnUiThread {
      pendingKey = key
      val types = if (mimeTypes.isEmpty()) arrayOf("*/*") else mimeTypes
      try {
        if (multiple) pickMany.launch(types) else pickOne.launch(types)
      } catch (e: Exception) {
        Log.w(TAG, "Couldn't open the document picker", e)
        finishPick(emptyList())
      }
    }
  }

  /** Copies the chosen documents into the cache (off the UI thread) and hands the paths to Rust. */
  private fun finishPick(uris: List<Uri>) {
    val key = pendingKey
    pendingKey = -1
    if (key < 0) return
    Thread {
          val paths = uris.mapNotNull { copyToCache(it) }.toTypedArray()
          nativeOnPicked(key, paths)
        }
        .start()
  }

  private fun copyToCache(uri: Uri): String? =
      try {
        val dir = File(cacheDir, "picks").apply { mkdirs() }
        // Keep the original name (and so its extension), which Rust uses to tell file types apart.
        val name = displayName(uri)?.replace('/', '_') ?: "file"
        val out = File(dir, "${System.nanoTime()}_$name")
        contentResolver.openInputStream(uri)?.use { input ->
          out.outputStream().use { input.copyTo(it) }
        } ?: throw IllegalStateException("couldn't open $uri")
        out.absolutePath
      } catch (e: Exception) {
        Log.w(TAG, "Couldn't read $uri", e)
        null
      }

  private fun displayName(uri: Uri): String? =
      contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
        if (it.moveToFirst()) it.getString(0) else null
      }

  /**
   * Copies a finished download into Pictures, Movies, Music or Downloads (an `ArtCraft` folder
   * inside it) so it shows up in the gallery and the Files app, then deletes the private copy.
   */
  fun publishMedia(path: String) {
    Thread {
          try {
            val file = File(path)
            if (!file.exists()) return@Thread
            val mime =
                MimeTypeMap.getSingleton().getMimeTypeFromExtension(file.extension.lowercase())
                    ?: "application/octet-stream"
            val (collection, folder) =
                when {
                  mime.startsWith("image/") ->
                      MediaStore.Images.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_PICTURES
                  mime.startsWith("video/") ->
                      MediaStore.Video.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_MOVIES
                  mime.startsWith("audio/") ->
                      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_MUSIC
                  else ->
                      MediaStore.Downloads.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_DOWNLOADS
                }
            val values =
                ContentValues().apply {
                  put(MediaStore.MediaColumns.DISPLAY_NAME, file.name)
                  put(MediaStore.MediaColumns.MIME_TYPE, mime)
                  put(MediaStore.MediaColumns.RELATIVE_PATH, "$folder/ArtCraft")
                  put(MediaStore.MediaColumns.IS_PENDING, 1)
                }
            val target = contentResolver.insert(collection, values) ?: return@Thread
            contentResolver.openOutputStream(target)?.use { out ->
              file.inputStream().use { it.copyTo(out) }
            }
            values.clear()
            values.put(MediaStore.MediaColumns.IS_PENDING, 0)
            contentResolver.update(target, values, null, null)
            file.delete()
          } catch (e: Exception) {
            Log.w(TAG, "Couldn't publish $path", e)
          }
        }
        .start()
  }
}
