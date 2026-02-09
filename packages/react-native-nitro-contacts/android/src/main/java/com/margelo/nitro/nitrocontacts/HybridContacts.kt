package com.margelo.nitro.nitrocontacts

import android.Manifest
import android.content.ContentResolver
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds
import android.provider.ContactsContract.Data
import androidx.core.content.ContextCompat
import com.margelo.nitro.core.Promise
import com.margelo.nitro.NitroModules

/**
 * High-performance contacts reader using a single-cursor aggregation strategy.
 *
 * Instead of N+1 queries (one per contact for phones, emails, etc.), we query
 * [ContactsContract.Data] once with a wide projection that covers every MIME
 * type we care about. We then iterate the cursor **once** and use a
 * `LinkedHashMap<Long, ContactBuilder>` to aggregate rows by CONTACT_ID.
 *
 * Each row in the Data table represents one "data item" (a phone, an email,
 * an address, a name, etc.) linked to a contact via CONTACT_ID. By grouping
 * rows in a single pass, we avoid repeated queries entirely.
 */
class HybridContacts : HybridContactsSpec() {

  override val memorySize: Long
    get() = 0L

  // ─── Permission Status ──────────────────────────────────────────────────

  override fun getPermissionStatus(): PermissionStatus {
    val ctx = NitroModules.applicationContext
      ?: return PermissionStatus.NOT_DETERMINED
    val granted = ContextCompat.checkSelfPermission(
      ctx,
      Manifest.permission.READ_CONTACTS
    )
    return if (granted == PackageManager.PERMISSION_GRANTED) {
      PermissionStatus.GRANTED
    } else {
      PermissionStatus.DENIED
    }
  }

  // ─── Request Permission ─────────────────────────────────────────────────

  override fun requestPermission(): Promise<Boolean> {
    return Promise.async {
      val ctx = NitroModules.applicationContext
        ?: return@async false

      if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_CONTACTS)
        == PackageManager.PERMISSION_GRANTED
      ) {
        return@async true
      }

      // NOTE: Runtime permission must be triggered from an Activity.
      // The consumer app (e.g. Expo) must ensure the permission is already
      // granted before calling getAll(), or use its own permission flow
      // (e.g. expo-permissions, PermissionsAndroid).
      // Returning false here signals that the permission is not yet granted.
      false
    }
  }

  // ─── Get All Contacts (Single-Cursor Aggregation) ───────────────────────

  override fun getAll(): Promise<Array<Contact>> {
    return Promise.async {
      val ctx = NitroModules.applicationContext
        ?: return@async emptyArray()

      val resolver: ContentResolver = ctx.contentResolver
      val contactMap = LinkedHashMap<Long, ContactBuilder>(256)

      val projection = arrayOf(
        Data.CONTACT_ID,                                    // 0
        Data.MIMETYPE,                                      // 1
        Data.DISPLAY_NAME_PRIMARY,                          // 2
        CommonDataKinds.StructuredName.GIVEN_NAME,          // 3
        CommonDataKinds.StructuredName.MIDDLE_NAME,         // 4
        CommonDataKinds.StructuredName.FAMILY_NAME,         // 5
        CommonDataKinds.Organization.COMPANY,               // 6
        CommonDataKinds.Organization.TITLE,                 // 7
        CommonDataKinds.Organization.DEPARTMENT,            // 8
        CommonDataKinds.Phone.NUMBER,                       // 9
        CommonDataKinds.Phone.TYPE,                         // 10
        CommonDataKinds.Phone.LABEL,                        // 11
        CommonDataKinds.Email.ADDRESS,                      // 12
        CommonDataKinds.Email.TYPE,                         // 13
        CommonDataKinds.Email.LABEL,                        // 14
        CommonDataKinds.StructuredPostal.STREET,            // 15
        CommonDataKinds.StructuredPostal.CITY,              // 16
        CommonDataKinds.StructuredPostal.REGION,            // 17
        CommonDataKinds.StructuredPostal.POSTCODE,          // 18
        CommonDataKinds.StructuredPostal.COUNTRY,           // 19
        CommonDataKinds.StructuredPostal.TYPE,              // 20
        CommonDataKinds.StructuredPostal.LABEL,             // 21
        CommonDataKinds.Website.URL,                        // 22
        CommonDataKinds.Website.TYPE,                       // 23
        CommonDataKinds.Website.LABEL,                      // 24
        CommonDataKinds.Note.NOTE,                          // 25
        CommonDataKinds.Event.START_DATE,                   // 26
        CommonDataKinds.Event.TYPE,                         // 27
      )

      val sortOrder = "${Data.DISPLAY_NAME_PRIMARY} ASC"

      val cursor: Cursor? = resolver.query(
        Data.CONTENT_URI,
        projection,
        null,
        null,
        sortOrder
      )

      cursor?.use { c ->
        // Cache column indices once – avoids repeated hash lookups per row
        val idxContactId = c.getColumnIndex(Data.CONTACT_ID)
        val idxMimeType = c.getColumnIndex(Data.MIMETYPE)
        val idxDisplayName = c.getColumnIndex(Data.DISPLAY_NAME_PRIMARY)
        val idxGivenName = c.getColumnIndex(CommonDataKinds.StructuredName.GIVEN_NAME)
        val idxMiddleName = c.getColumnIndex(CommonDataKinds.StructuredName.MIDDLE_NAME)
        val idxFamilyName = c.getColumnIndex(CommonDataKinds.StructuredName.FAMILY_NAME)
        val idxCompany = c.getColumnIndex(CommonDataKinds.Organization.COMPANY)
        val idxJobTitle = c.getColumnIndex(CommonDataKinds.Organization.TITLE)
        val idxDepartment = c.getColumnIndex(CommonDataKinds.Organization.DEPARTMENT)
        val idxPhoneNumber = c.getColumnIndex(CommonDataKinds.Phone.NUMBER)
        val idxPhoneType = c.getColumnIndex(CommonDataKinds.Phone.TYPE)
        val idxPhoneLabel = c.getColumnIndex(CommonDataKinds.Phone.LABEL)
        val idxEmailAddress = c.getColumnIndex(CommonDataKinds.Email.ADDRESS)
        val idxEmailType = c.getColumnIndex(CommonDataKinds.Email.TYPE)
        val idxEmailLabel = c.getColumnIndex(CommonDataKinds.Email.LABEL)
        val idxStreet = c.getColumnIndex(CommonDataKinds.StructuredPostal.STREET)
        val idxCity = c.getColumnIndex(CommonDataKinds.StructuredPostal.CITY)
        val idxRegion = c.getColumnIndex(CommonDataKinds.StructuredPostal.REGION)
        val idxPostcode = c.getColumnIndex(CommonDataKinds.StructuredPostal.POSTCODE)
        val idxCountry = c.getColumnIndex(CommonDataKinds.StructuredPostal.COUNTRY)
        val idxPostalType = c.getColumnIndex(CommonDataKinds.StructuredPostal.TYPE)
        val idxPostalLabel = c.getColumnIndex(CommonDataKinds.StructuredPostal.LABEL)
        val idxWebUrl = c.getColumnIndex(CommonDataKinds.Website.URL)
        val idxWebType = c.getColumnIndex(CommonDataKinds.Website.TYPE)
        val idxWebLabel = c.getColumnIndex(CommonDataKinds.Website.LABEL)
        val idxNote = c.getColumnIndex(CommonDataKinds.Note.NOTE)
        val idxEventDate = c.getColumnIndex(CommonDataKinds.Event.START_DATE)
        val idxEventType = c.getColumnIndex(CommonDataKinds.Event.TYPE)

        while (c.moveToNext()) {
          val contactId = c.getLongSafe(idxContactId) ?: continue
          val mimeType = c.getStringSafe(idxMimeType) ?: continue

          val builder = contactMap.getOrPut(contactId) {
            ContactBuilder(
              id = contactId.toString(),
              displayName = c.getStringSafe(idxDisplayName) ?: ""
            )
          }

          when (mimeType) {
            CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE -> {
              builder.givenName = c.getStringSafe(idxGivenName) ?: ""
              builder.middleName = c.getStringSafe(idxMiddleName) ?: ""
              builder.familyName = c.getStringSafe(idxFamilyName) ?: ""
            }

            CommonDataKinds.Organization.CONTENT_ITEM_TYPE -> {
              builder.company = c.getStringSafe(idxCompany) ?: ""
              builder.jobTitle = c.getStringSafe(idxJobTitle) ?: ""
              builder.department = c.getStringSafe(idxDepartment) ?: ""
            }

            CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> {
              val number = c.getStringSafe(idxPhoneNumber) ?: return@use
              val type = c.getIntSafe(idxPhoneType) ?: CommonDataKinds.Phone.TYPE_OTHER
              val label = c.getStringSafe(idxPhoneLabel)
              builder.phoneNumbers.add(
                LabeledValue(
                  id = contactId.toString(),
                  label = resolvePhoneLabel(type, label),
                  value = number
                )
              )
            }

            CommonDataKinds.Email.CONTENT_ITEM_TYPE -> {
              val address = c.getStringSafe(idxEmailAddress) ?: return@use
              val type = c.getIntSafe(idxEmailType) ?: CommonDataKinds.Email.TYPE_OTHER
              val label = c.getStringSafe(idxEmailLabel)
              builder.emails.add(
                LabeledValue(
                  id = contactId.toString(),
                  label = resolveEmailLabel(type, label),
                  value = address
                )
              )
            }

            CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE -> {
              val type = c.getIntSafe(idxPostalType)
                ?: CommonDataKinds.StructuredPostal.TYPE_OTHER
              val label = c.getStringSafe(idxPostalLabel)
              builder.postalAddresses.add(
                PostalAddress(
                  street = c.getStringSafe(idxStreet) ?: "",
                  city = c.getStringSafe(idxCity) ?: "",
                  state = c.getStringSafe(idxRegion) ?: "",
                  postalCode = c.getStringSafe(idxPostcode) ?: "",
                  country = c.getStringSafe(idxCountry) ?: "",
                  isoCountryCode = "",
                  label = resolvePostalLabel(type, label)
                )
              )
            }

            CommonDataKinds.Website.CONTENT_ITEM_TYPE -> {
              val url = c.getStringSafe(idxWebUrl) ?: return@use
              val type = c.getIntSafe(idxWebType)
                ?: CommonDataKinds.Website.TYPE_OTHER
              val label = c.getStringSafe(idxWebLabel)
              builder.urlAddresses.add(
                LabeledValue(
                  id = contactId.toString(),
                  label = resolveWebLabel(type, label),
                  value = url
                )
              )
            }

            CommonDataKinds.Note.CONTENT_ITEM_TYPE -> {
              builder.note = c.getStringSafe(idxNote) ?: ""
            }

            CommonDataKinds.Event.CONTENT_ITEM_TYPE -> {
              val eventType = c.getIntSafe(idxEventType)
              if (eventType == CommonDataKinds.Event.TYPE_BIRTHDAY) {
                builder.birthday = c.getStringSafe(idxEventDate)
              }
            }

            CommonDataKinds.Photo.CONTENT_ITEM_TYPE -> {
              val photoUri = Uri.withAppendedPath(
                ContactsContract.Contacts.CONTENT_URI,
                "$contactId/photo"
              )
              builder.thumbnailPath = photoUri.toString()
              builder.hasImage = true
            }
          }
        }
      }

      contactMap.values.map { it.toContact() }.toTypedArray()
    }
  }

  // ─── Mutable aggregation container ────────────────────────────────────────

  private data class ContactBuilder(
    val id: String,
    var displayName: String = "",
    var givenName: String = "",
    var middleName: String = "",
    var familyName: String = "",
    var company: String = "",
    var jobTitle: String = "",
    var department: String = "",
    var note: String = "",
    var birthday: String? = null,
    val emails: MutableList<LabeledValue> = mutableListOf(),
    val phoneNumbers: MutableList<LabeledValue> = mutableListOf(),
    val postalAddresses: MutableList<PostalAddress> = mutableListOf(),
    val urlAddresses: MutableList<LabeledValue> = mutableListOf(),
    var thumbnailPath: String? = null,
    var hasImage: Boolean = false
  ) {
    fun toContact(): Contact = Contact(
      id = id,
      displayName = displayName,
      givenName = givenName,
      middleName = middleName,
      familyName = familyName,
      company = company,
      jobTitle = jobTitle,
      department = department,
      note = note,
      birthday = birthday,
      emails = emails.toTypedArray(),
      phoneNumbers = phoneNumbers.toTypedArray(),
      postalAddresses = postalAddresses.toTypedArray(),
      urlAddresses = urlAddresses.toTypedArray(),
      thumbnailPath = thumbnailPath,
      hasImage = hasImage
    )
  }

  // ─── Safe cursor accessors (handle -1 index & null) ───────────────────

  private fun Cursor.getStringSafe(index: Int): String? {
    if (index < 0 || isNull(index)) return null
    return getString(index)
  }

  private fun Cursor.getIntSafe(index: Int): Int? {
    if (index < 0 || isNull(index)) return null
    return getInt(index)
  }

  private fun Cursor.getLongSafe(index: Int): Long? {
    if (index < 0 || isNull(index)) return null
    return getLong(index)
  }

  // ─── Label resolvers ──────────────────────────────────────────────────

  private fun resolvePhoneLabel(type: Int, label: String?): String = when (type) {
    CommonDataKinds.Phone.TYPE_HOME -> "home"
    CommonDataKinds.Phone.TYPE_MOBILE -> "mobile"
    CommonDataKinds.Phone.TYPE_WORK -> "work"
    CommonDataKinds.Phone.TYPE_MAIN -> "main"
    CommonDataKinds.Phone.TYPE_CUSTOM -> label ?: "other"
    else -> "other"
  }

  private fun resolveEmailLabel(type: Int, label: String?): String = when (type) {
    CommonDataKinds.Email.TYPE_HOME -> "home"
    CommonDataKinds.Email.TYPE_WORK -> "work"
    CommonDataKinds.Email.TYPE_CUSTOM -> label ?: "other"
    else -> "other"
  }

  private fun resolvePostalLabel(type: Int, label: String?): String = when (type) {
    CommonDataKinds.StructuredPostal.TYPE_HOME -> "home"
    CommonDataKinds.StructuredPostal.TYPE_WORK -> "work"
    CommonDataKinds.StructuredPostal.TYPE_CUSTOM -> label ?: "other"
    else -> "other"
  }

  private fun resolveWebLabel(type: Int, label: String?): String = when (type) {
    CommonDataKinds.Website.TYPE_HOME -> "home"
    CommonDataKinds.Website.TYPE_WORK -> "work"
    CommonDataKinds.Website.TYPE_CUSTOM -> label ?: "other"
    else -> "other"
  }
}
