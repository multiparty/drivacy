// Copyright 2020 multiparty.org

// Main entry point to our protocol.
// This file must be run from the command line once per server:
// every time this file is run, it is logically equivalent to a new
// server.
// The server's configurations, including which party it belongs to, is
// set by the input configuration file passed to it via the command line.

#include <stdlib.h>

// NOLINTNEXTLINE
#include <chrono>
#include <cstdint>
#include <iostream>
#include <vector>

#include "absl/flags/flag.h"
#include "absl/flags/parse.h"
#include "absl/flags/usage.h"
#include "absl/status/status.h"
#include "absl/strings/str_format.h"
#include "drivacy/parties/offline/client.h"
#include "drivacy/types/config.pb.h"
#include "drivacy/types/types.h"
#include "drivacy/util/file.h"
#include "drivacy/util/status.h"

ABSL_FLAG(std::string, config, "", "The path to configuration file (required)");
ABSL_FLAG(uint32_t, machine, 0, "The head machine id to query (required)");
ABSL_FLAG(uint32_t, queries, 0, "The number of queries to make (required)");
ABSL_FLAG(uint32_t, client, 0,
          "The client id (unique among clients connected "
          "to the same machine (required)");

absl::Status Setup(uint32_t machine_id, uint32_t client_id,
                   uint32_t query_count, const std::string &config_path) {
  // Read configuration.
  drivacy::types::Configuration config;
  CHECK_STATUS(drivacy::util::file::ReadProtobufFromJson(config_path, &config));

  // Setup party and listen to incoming queries and responses.
  drivacy::parties::offline::Client client(machine_id, client_id, config);

  // Subscribe.
  auto start_ts = std::chrono::system_clock::now();
  client.Subscribe(query_count);

  // Compute time taken.
  auto end_ts = std::chrono::system_clock::now();
  auto diff =
      std::chrono::duration_cast<std::chrono::nanoseconds>(end_ts - start_ts);
  std::cout << "Total time: " << diff.count() << "ns" << std::endl;

  // Will never really get here...
  return absl::OkStatus();
}

int main(int argc, char *argv[]) {
  // Verify protobuf library was linked properly.
  GOOGLE_PROTOBUF_VERIFY_VERSION;

  // Command line usage message.
  absl::SetProgramUsageMessage(absl::StrFormat("usage: %s %s", argv[0],
                                               "--table=path/to/table.json "
                                               "--config=path/to/config.json "
                                               "--queries=#queries"));
  absl::ParseCommandLine(argc, argv);

  // Get command line flags.
  const std::string &config_path = absl::GetFlag(FLAGS_config);
  uint32_t machine_id = absl::GetFlag(FLAGS_machine);
  uint32_t client_id = absl::GetFlag(FLAGS_client);
  uint32_t query_count = absl::GetFlag(FLAGS_queries);
  if (config_path.empty()) {
    std::cout << "Please provide a valid config file using --config"
              << std::endl;
    return 1;
  }
  if (machine_id == 0) {
    std::cout << "Please provide a valid machine id to query using --machine"
              << std::endl;
    return 1;
  }
  if (client_id == 0) {
    std::cout << "Please provide a valid client id using --client" << std::endl;
    return 1;
  }
  if (query_count == 0) {
    std::cout << "Please provide a valid query count using --queries"
              << std::endl;
    return 1;
  }

  // Execute mock protocol.
  absl::Status output = Setup(machine_id, client_id, query_count, config_path);
  if (!output.ok()) {
    std::cout << output << std::endl;
    return 1;
  }

  std::cout << "Success!" << std::endl;

  // Clean up protobuf.
  google::protobuf::ShutdownProtobufLibrary();
  return 0;
}
