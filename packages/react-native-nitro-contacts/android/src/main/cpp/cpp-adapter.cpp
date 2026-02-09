#include <jni.h>
#include "NitroContactsOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::nitrocontacts::initialize(vm);
}
